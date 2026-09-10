import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { loadBookingAndVerifyStudent, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';
import { sendPushToTutor } from '@/core/server/push';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { threadMessageSchema } from '@/core/validation/schemas';


async function requireStudentId(request: NextRequest): Promise<string | null> {
  if (!adminAuth) return null;
  const user = await getSessionUser(request);
  if (user?.role !== 'student') return null;
  return user.uid ?? null;
}

// Reading a thread's messages is now a direct client-SDK onSnapshot (firestore.rules grants a
// participant student read access — see isParticipantStudent), the same as the tutor side; only
// sending goes through the Admin SDK below, since only sending needs the server-side hook to
// notify the tutor via push.

// POST /api/account/bookings/[id]/messages — a logged-in student sends a message.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const studentId = await requireStudentId(request);
  if (!studentId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseJsonBody(request, threadMessageSchema);
  if (parsed.error) return parsed.error;
  const { text, senderName = 'Student' } = parsed.data;

  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const booking = await loadBookingAndVerifyStudent(adminDb, id, studentId);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  const message = await sendThreadMessage(
    adminDb,
    {
      id: booking.id,
      tutorId: booking.tutorId,
      participantPhones: booking.participants.map((p) => p.phone),
      participantStudentIds: booking.participantStudentIds,
    },
    'student',
    studentId,
    senderName,
    text
  );

  await sendPushToTutor(adminDb, booking.tutorId, {
    title: 'New message from a student',
    body: text.slice(0, 140),
    url: '/tutor/dashboard?tab=bookings',
  }).catch(() => {});

  return NextResponse.json({ success: true, message });
}
