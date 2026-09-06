import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/core/firebase/admin';

const SESSION_COOKIE_NAME = 'session';
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

export async function POST(request: NextRequest) {
  if (!adminAuth) {
    return NextResponse.json({ success: false, error: 'Admin SDK not initialized' }, { status: 500 });
  }

  const { idToken } = await request.json();
  if (!idToken) {
    return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.role !== 'superadmin' && decoded.role !== 'tutor' && decoded.role !== 'student') {
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
  } catch (error: any) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
