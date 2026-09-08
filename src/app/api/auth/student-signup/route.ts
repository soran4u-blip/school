import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { logServerError } from '@/core/server/errorLog';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { studentSignupSchema } from '@/core/validation/schemas';

// Students self-register (no admin approval, unlike tutors) — this route runs immediately
// after the client creates the Firebase Auth user, to attach the 'student' role + their phone
// as a custom claim (phone lives in the claim, not just the Firestore doc, so authenticated
// API routes can trust it without an extra Firestore read — same pattern as tutor's tutorId).
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const parsed = await parseJsonBody(request, studentSignupSchema);
  if (parsed.error) return parsed.error;
  const { idToken, fullName, phone } = parsed.data;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.role === 'superadmin' || decoded.role === 'tutor') {
      return NextResponse.json({ success: false, error: 'This account already has a different role' }, { status: 409 });
    }
    await adminAuth.setCustomUserClaims(decoded.uid, { role: 'student', phone: phone.trim() });

    const now = new Date().toISOString();
    await adminDb.collection('students').doc(decoded.uid).set({
      id: decoded.uid,
      userId: decoded.uid,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: decoded.email || '',
      createdAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Student signup failed:', error);
    logServerError('Student signup failed', { stack: error?.stack, url: request.url });
    return NextResponse.json({ success: false, error: 'Signup failed' }, { status: 500 });
  }
}
