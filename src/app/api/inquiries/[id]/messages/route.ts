import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { loadInquiryAndVerifyPhone, listThreadMessages, sendThreadMessage, MAX_MESSAGE_LENGTH } from '@/core/server/threads';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { inquiryThreadMessageSchema } from '@/core/validation/schemas';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { notifyInstitutionOfInquiryReply } from '@/core/server/notifications';
import { getSessionUser } from '@/core/server/session';
import { Inquiry } from '@/core/types/review';

// GET /api/inquiries/[id]/messages?phone=... — a guest (parent) reads their thread for this inquiry.
// Rate-limited by IP: the phone is the only credential, so an unlimited GET here is a brute-force
// oracle for guessing a real phone number against a known inquiry id.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const rateLimit = await checkRateLimit(adminDb, `inquiry-thread:ip:${getClientIp(request)}`, { max: 20, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
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
// Rate-limited by IP for the same reason as GET, plus this one also writes.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const rateLimit = await checkRateLimit(adminDb, `inquiry-thread:ip:${getClientIp(request)}`, { max: 20, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  const { id } = await params;
  const parsed = await parseJsonBody(request, inquiryThreadMessageSchema);
  if (parsed.error) return parsed.error;
  const { phone, text, senderName = 'Parent' } = parsed.data;

  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const inquiry = phone
    ? await loadInquiryAndVerifyPhone(adminDb, id, phone)
    : await (async () => {
        const user = await getSessionUser(request);
        if (user?.role !== 'institution' || !user.institutionId) return null;
        const snap = await adminDb!.collection('inquiries').doc(id).get();
        if (!snap.exists || (snap.data() as { institutionId?: string }).institutionId !== user.institutionId) return null;
        return snap.data() as Inquiry;
      })();
  if (!inquiry) {
    return NextResponse.json({ success: false, error: phone ? 'Inquiry not found for that phone number' : 'Unauthorized' }, { status: phone ? 404 : 401 });
  }

  const isOwnerReply = !phone;
  const now = new Date().toISOString();
  const message = await sendThreadMessage(
    adminDb,
    { id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    isOwnerReply ? 'institution' : 'student',
    isOwnerReply ? inquiry.institutionId : inquiry.phone,
    isOwnerReply ? senderName : senderName,
    text
  );

  if (isOwnerReply) {
    const firstResponseAt = inquiry.firstResponseAt || now;
    await adminDb.collection('inquiries').doc(id).update({
      status: inquiry.status === 'NEW' ? 'CONTACTED' : inquiry.status,
      firstResponseAt,
      lastResponseAt: now,
      firstResponseMinutes: Math.max(0, Math.round((new Date(firstResponseAt).getTime() - new Date(inquiry.createdAt).getTime()) / 60000)),
      updatedAt: now,
    });
  } else {
    await notifyInstitutionOfInquiryReply(adminDb, inquiry.institutionId, id, senderName, text);
  }

  return NextResponse.json({ success: true, message });
}
