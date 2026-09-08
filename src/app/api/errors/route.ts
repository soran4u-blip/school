import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { ErrorLog } from '@/core/types/errorLog';

// POST /api/errors — a global client-side error/rejection handler reports here (see
// src/components/shared/ErrorReporter.tsx). No auth required (an error can happen to a fully
// logged-out visitor), so this is intentionally narrow: fixed-size fields only, no arbitrary
// payload, and it never throws back a failure the caller would need to handle.
export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.slice(0, 2000) : null;
  if (!message) {
    return NextResponse.json({ success: false }, { status: 200 });
  }

  try {
    const ref = adminDb.collection('errorLogs').doc();
    const entry: ErrorLog = {
      id: ref.id,
      source: 'client',
      message,
      stack: typeof body?.stack === 'string' ? body.stack.slice(0, 4000) : undefined,
      url: typeof body?.url === 'string' ? body.url.slice(0, 500) : undefined,
      userAgent: request.headers.get('user-agent')?.slice(0, 300) || undefined,
      createdAt: new Date().toISOString(),
    };
    await ref.set(entry);
  } catch {
    // Best-effort — a failure to log an error should never itself surface as an error.
  }

  return NextResponse.json({ success: true });
}
