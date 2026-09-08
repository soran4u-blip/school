import { NextRequest, NextResponse } from 'next/server';
import { logClientError } from '@/core/server/errorLog';
import { clientErrorReportSchema } from '@/core/validation/schemas';

// POST /api/errors — a global client-side error/rejection handler reports here (see
// src/components/shared/ErrorReporter.tsx). No auth required (an error can happen to a fully
// logged-out visitor), so this stays intentionally forgiving: a malformed body just gets dropped,
// never surfaced back to the caller as a failure it would need to handle.
export async function POST(request: NextRequest) {
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
