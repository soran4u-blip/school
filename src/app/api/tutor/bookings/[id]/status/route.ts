import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { sendPushToStudent } from '@/core/server/push';
import { syncBookingViews } from '@/core/server/bookingViews';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { tutorBookingStatusSchema } from '@/core/validation/schemas';


const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  NO_SHOW: 'Marked as No-Show',
};

// POST /api/tutor/bookings/[id]/status — the owning tutor updates a booking's status. Runs
// through the Admin SDK (rather than the tutor's usual direct client-SDK write) specifically so
// it can notify the participant student(s) via push — a plain client updateDoc has no server-side
// hook to trigger that from.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'tutor' || !user.tutorId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const tutorId = user.tutorId;

  const parsed = await parseJsonBody(request, tutorBookingStatusSchema);
  if (parsed.error) return parsed.error;
  const { status } = parsed.data;

  const { id } = await params;
  const ref = adminDb.collection('bookings').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }
  const booking = snap.data() as Booking;
  if (booking.tutorId !== tutorId) {
    return NextResponse.json({ success: false, error: 'This booking does not belong to you' }, { status: 403 });
  }

  await ref.update({ status });

  const tutorSnap = await adminDb.collection('tutors').doc(tutorId).get();
  await syncBookingViews(adminDb, { ...booking, status }, tutorSnap.exists ? (tutorSnap.data() as Tutor) : null);

  if (STATUS_LABEL[status]) {
    const tutorName = tutorSnap.exists ? (tutorSnap.data()!.fullName?.en || tutorSnap.data()!.fullName?.ar) : 'your tutor';
    await Promise.all(
      booking.participantStudentIds.map((studentId) =>
        sendPushToStudent(adminDb!, studentId, {
          title: `Booking ${STATUS_LABEL[status]}`,
          body: `Your session with ${tutorName} on ${booking.date} at ${booking.startTime} was ${STATUS_LABEL[status].toLowerCase()}.`,
          url: '/account',
        }).catch(() => {})
      )
    );
  }

  return NextResponse.json({ success: true });
}
