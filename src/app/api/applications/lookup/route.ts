import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Application } from '@/core/types/application';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';

// GET /api/applications/lookup?email=... — a tutor/institution/employer applicant checks the
// status of their own join-the-platform application(s) by the email they applied with, since
// /apply gives no account or reference number they could sign in with. Sanitized to only what an
// applicant needs (no rejectionReason detail beyond what admins wrote, no other applicants' data).
// Rate-limited by IP for the same reason as /api/inquiries/lookup — email is the only credential.
export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(adminDb, `application-lookup:ip:${getClientIp(request)}`, { max: 10, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const email = new URL(request.url).searchParams.get('email')?.trim();
  if (!email) {
    return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
  }

  const snap = await adminDb.collection('applications').where('email', '==', email).get();

  const applications = snap.docs
    .map((d) => d.data() as Application)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      createdAt: a.createdAt,
      reviewedAt: a.reviewedAt || null,
      rejectionReason: a.status === 'REJECTED' ? a.rejectionReason || null : null,
    }));

  return NextResponse.json({ success: true, applications });
}
