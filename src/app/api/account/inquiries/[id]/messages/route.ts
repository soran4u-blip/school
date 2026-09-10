import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { loadInquiryAndVerifyPhone, listThreadMessages, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { threadMessageSchema } from '@/core/validation/schemas';


async function requireStudentPhone(request: NextRequest): Promise<string | null> {
  if (!adminAuth) return null;
  const user = await getSessionUser(request);
  if (user?.role !== 'student' || !user.phone) return null;
  return user.phone ?? null;
}

// GET /api/account/inquiries/[id]/messages — a logged-in student reads their thread, phone
// derived from their own session (never a client-supplied value).
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const phone = await requireStudentPhone(request);
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const inquiry = await loadInquiryAndVerifyPhone(adminDb, id, phone);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
  }

  const messages = await listThreadMessages(adminDb, id);
  return NextResponse.json({ success: true, messages });
}

// POST /api/account/inquiries/[id]/messages — a logged-in student sends a message.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const phone = await requireStudentPhone(request);
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const parsed = await parseJsonBody(request, threadMessageSchema);
  if (parsed.error) return parsed.error;
  const { text, senderName = 'Parent' } = parsed.data;

  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const inquiry = await loadInquiryAndVerifyPhone(adminDb, id, phone);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
  }

  const message = await sendThreadMessage(
    adminDb,
    { id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    'student',
    inquiry.phone,
    senderName,
    text
  );
  return NextResponse.json({ success: true, message });
}
