import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/core/firebase/admin';
import { SESSION_COOKIE_NAME } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { sessionLoginSchema } from '@/core/validation/schemas';
import { adminDb } from '@/core/firebase/admin';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';

const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

// Rate-limited by IP: each call spends a quota-metered verifyIdToken/createSessionCookie call
// against Firebase Auth, so an unlimited endpoint is a cheap way to burn that quota or grind
// through session-creation attempts. The cap is generous — 20/15min — since a legitimate user
// opening several tabs or retrying after a typo shouldn't be the thing that trips it.
export async function POST(request: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json({ success: false, error: 'Admin SDK not initialized' }, { status: 500 });
  }

  if (adminDb) {
    const rateLimit = await checkRateLimit(adminDb, `session:ip:${getClientIp(request)}`, { max: 20, windowMinutes: 15 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Please try again later.' }, { status: 429 });
    }
  }

  const parsed = await parseJsonBody(request, sessionLoginSchema);
  if (parsed.error) return parsed.error;
  const { idToken } = parsed.data;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.role !== 'superadmin' && decoded.role !== 'tutor' && decoded.role !== 'student' && decoded.role !== 'institution' && decoded.role !== 'employer') {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, role: decoded.role });
  } catch (error: unknown) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
