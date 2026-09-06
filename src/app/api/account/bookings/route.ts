import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';

const SESSION_COOKIE_NAME = 'session';

// GET /api/account/bookings — a logged-in student's own bookings, looked up by the phone
// number on their account (stored in their custom claim at signup), not a client-supplied
// value — proxy.ts already gates this path to role 'student', this route independently
// re-verifies the session so it never trusts anything the client claims about itself.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student' || !decoded.phone) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const snap = await adminDb.collection('bookings').where('participantPhones', 'array-contains', decoded.phone).get();
    const tutorIds = [...new Set(snap.docs.map((d) => (d.data() as Booking).tutorId))];
    const tutors = new Map<string, Tutor>();
    await Promise.all(
      tutorIds.map(async (id) => {
        const t = await adminDb!.collection('tutors').doc(id).get();
        if (t.exists) tutors.set(id, t.data() as Tutor);
      })
    );

    const bookings = snap.docs
      .map((d) => d.data() as Booking)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .map((b) => {
        const tutor = tutors.get(b.tutorId);
        return {
          id: b.id,
          tutorId: b.tutorId,
          tutorName: tutor?.fullName || null,
          tutorWhatsapp: tutor?.whatsappNumber || null,
          type: b.type,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: b.status,
          pricePerStudent: b.pricePerStudent,
          groupSize: b.type === 'GROUP' ? b.participants.length : undefined,
          maxGroupSize: b.type === 'GROUP' ? b.maxGroupSize : undefined,
        };
      });

    return NextResponse.json({ success: true, phone: decoded.phone, bookings });
  } catch (error) {
    console.error('Account bookings lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
