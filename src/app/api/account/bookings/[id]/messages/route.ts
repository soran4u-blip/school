import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { loadBookingAndVerifyStudent, listThreadMessages, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { threadMessageSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';

async function requireStudentId(request: NextRequest): Promise<string | null> {
  if (!adminAuth) return null;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

// GET /api/account/bookings/[id]/messages — a logged-in student reads their thread, identity
// derived from their own session (never a client-supplied value).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const studentId = await requireStudentId(request);
  if (!studentId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const booking = await loadBookingAndVerifyStudent(adminDb, id, studentId);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
  }

  const messages = await listThreadMessages(adminDb, id);
  return NextResponse.json({ success: true, messages });
}

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
    { id: booking.id, tutorId: booking.tutorId, participantPhones: booking.participants.map((p) => p.phone) },
    'student',
    senderName,
    text
  );
  return NextResponse.json({ success: true, message });
}
