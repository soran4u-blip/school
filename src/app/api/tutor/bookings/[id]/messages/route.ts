import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';
import { sendPushToStudent } from '@/core/server/push';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { threadMessageSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';

async function requireTutorId(request: NextRequest): Promise<string | null> {
  if (!adminAuth) return null;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'tutor' || !decoded.tutorId) return null;
    return decoded.tutorId as string;
  } catch {
    return null;
  }
}

// POST /api/tutor/bookings/[id]/messages — the owning tutor sends a message. Reading a thread's
// existing messages stays a direct client-SDK read (firestore.rules already permits the owning
// tutor that); only sending goes through the Admin SDK, since only sending needs the
// server-side hook to notify the participant student(s) via push.
// Admin SDK (rather than the tutor's usual direct client-SDK write) specifically so it can
// notify the participant student(s) via push.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const tutorId = await requireTutorId(request);
  if (!tutorId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseJsonBody(request, threadMessageSchema);
  if (parsed.error) return parsed.error;
  const { text, senderName = 'Tutor' } = parsed.data;

  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const ref = adminDb.collection('bookings').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }
  const booking = snap.data() as Booking;
  if (booking.tutorId !== tutorId) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  const message = await sendThreadMessage(
    adminDb,
    { id: booking.id, tutorId: booking.tutorId, participantPhones: booking.participants.map((p) => p.phone) },
    'tutor',
    senderName,
    text
  );

  await Promise.all(
    booking.participantStudentIds.map((studentId) =>
      sendPushToStudent(adminDb!, studentId, {
        title: 'New message from your tutor',
        body: text.slice(0, 140),
        url: '/account',
      }).catch(() => {})
    )
  );

  return NextResponse.json({ success: true, message });
}
