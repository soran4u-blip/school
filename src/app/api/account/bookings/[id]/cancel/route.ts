import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';

const SESSION_COOKIE_NAME = 'session';

// POST /api/account/bookings/[id]/cancel — a logged-in student cancels or leaves a booking,
// identity derived from their own session (never a client-supplied value).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const ref = adminDb.collection('bookings').doc(id);

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Booking not found');
      const booking = snap.data() as Booking;

      if (!booking.participantStudentIds?.includes(studentId)) {
        throw new Error('This booking does not belong to your account');
      }
      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }
      if (booking.status === 'COMPLETED' || booking.status === 'NO_SHOW') {
        throw new Error('This session has already taken place and can no longer be cancelled');
      }

      if (booking.participants.length <= 1) {
        tx.update(ref, { status: 'CANCELLED' });
        return;
      }

      // Group booking with other students still in it — remove just this participant
      // and recompute the split price for whoever remains.
      const tutorSnap = await tx.get(adminDb!.collection('tutors').doc(booking.tutorId));
      const tutor = tutorSnap.data() as Tutor;
      const participants = booking.participants.filter((p) => p.studentId !== studentId);
      const participantStudentIds = booking.participantStudentIds.filter((id) => id !== studentId);
      const pricePerStudent = {
        iqd: Math.round(tutor.groupRate.iqd / participants.length),
        usd: Math.round(tutor.groupRate.usd / participants.length),
      };
      tx.update(ref, { participants, participantStudentIds, pricePerStudent });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to cancel booking' }, { status: 400 });
  }
}
