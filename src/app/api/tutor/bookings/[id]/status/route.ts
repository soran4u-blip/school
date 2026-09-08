import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { sendPushToStudent } from '@/core/server/push';

const SESSION_COOKIE_NAME = 'session';
const VALID_STATUSES: Booking['status'][] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

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

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let tutorId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'tutor' || !decoded.tutorId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    tutorId = decoded.tutorId as string;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status: Booking['status'] | undefined = body?.status;
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

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

  if (STATUS_LABEL[status]) {
    const tutorSnap = await adminDb.collection('tutors').doc(tutorId).get();
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
