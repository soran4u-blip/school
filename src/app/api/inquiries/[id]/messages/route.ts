import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { loadInquiryAndVerifyPhone, listThreadMessages, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';

// GET /api/inquiries/[id]/messages?phone=... — a guest (parent) reads their thread for this inquiry.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const inquiry = await loadInquiryAndVerifyPhone(adminDb, id, phone);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Inquiry not found for that phone number' }, { status: 404 });
  }

  const messages = await listThreadMessages(adminDb, id);
  return NextResponse.json({ success: true, messages });
}

// POST /api/inquiries/[id]/messages — a guest (parent) sends a message on their inquiry thread.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const phone = body?.phone?.trim();
  const text = body?.text?.trim();
  const senderName = body?.senderName?.trim() || 'Parent';

  if (!phone || !text) {
    return NextResponse.json({ success: false, error: 'Missing phone or message text' }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const inquiry = await loadInquiryAndVerifyPhone(adminDb, id, phone);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Inquiry not found for that phone number' }, { status: 404 });
  }

  const message = await sendThreadMessage(
    adminDb,
    { id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    'student',
    senderName,
    text
  );
  return NextResponse.json({ success: true, message });
}
