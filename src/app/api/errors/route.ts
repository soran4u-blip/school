import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { logClientError } from '@/core/server/errorLog';
import { clientErrorReportSchema } from '@/core/validation/schemas';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';

// POST /api/errors — a global client-side error/rejection handler reports here (see
// src/components/shared/ErrorReporter.tsx). No auth required (an error can happen to a fully
// logged-out visitor), so this stays intentionally forgiving: a malformed body just gets dropped,
// never surfaced back to the caller as a failure it would need to handle.
//
// Rate-limited by IP: the fingerprint dedup in logClientError only collapses identical messages,
// so without a limit here an attacker can vary the text per request and write unlimited unique
// documents to errorLogs, burying real errors and running up Firestore writes.
export async function POST(request: NextRequest) {
  if (adminDb) {
    const rateLimit = await checkRateLimit(adminDb, `errors:ip:${getClientIp(request)}`, { max: 30, windowMinutes: 60 });
    if (!rateLimit.allowed) {
      // Silently dropped, same posture as a malformed body — a rate-limited reporter has no need
      // to know or retry.
      return NextResponse.json({ success: false }, { status: 200 });
    }
  }

  const body = await request.json().catch(() => null);
  const parsed = clientErrorReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  await logClientError(parsed.data.message, {
    stack: parsed.data.stack,
    url: parsed.data.url,
    severity: parsed.data.severity,
    userAgent: request.headers.get('user-agent')?.slice(0, 300) || undefined,
  });

  return NextResponse.json({ success: true });
}
