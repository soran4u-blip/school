import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';


// GET /api/account/bookings — a logged-in student's own bookings, looked up by their account
// uid (verified server-side from the session), never a client-supplied value.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {

    const snap = await adminDb.collection('bookings').where('participantStudentIds', 'array-contains', user.uid).get();
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

    return NextResponse.json({ success: true, phone: user.phone, bookings });
  } catch (error) {
    console.error('Account bookings lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
