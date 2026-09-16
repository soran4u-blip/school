import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Inquiry } from '@/core/types/review';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { inquirySchema } from '@/core/validation/schemas';

// Public admissions inquiries are written server-side so validation, rate limiting, and the
// institution lookup cannot be bypassed by a client-side Firestore write.
export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(adminDb, `inquiry:ip:${getClientIp(request)}`, { max: 5, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, inquirySchema);
  if (parsed.error) return parsed.error;

  const { institutionId, fullName, phone, email, message, honeypot } = parsed.data;
  if (honeypot) {
    return NextResponse.json({ success: true, inquiry: null }, { status: 201 });
  }

  const institutionSnap = await adminDb.collection('institutions').doc(institutionId).get();
  if (!institutionSnap.exists) {
    return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
  }

  const institution = institutionSnap.data() as { name?: { en?: string; ar?: string } };
  const ref = adminDb.collection('inquiries').doc();
  const inquiry: Inquiry = {
    id: ref.id,
    institutionId,
    institutionName: institution.name?.en || institution.name?.ar || 'Institution',
    fullName,
    phone,
    ...(email ? { email } : {}),
    message,
    status: 'NEW',
    createdAt: new Date().toISOString(),
  };

  await ref.set(inquiry);
  return NextResponse.json({ success: true, inquiry }, { status: 201 });
}