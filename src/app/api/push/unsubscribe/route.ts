import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import crypto from 'crypto';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { pushUnsubscribeSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';

// POST /api/push/unsubscribe — removes this browser's subscription for the logged-in student.
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, pushUnsubscribeSchema);
  if (parsed.error) return parsed.error;
  const { endpoint } = parsed.data;

  const subId = crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
  await adminDb.collection('students').doc(studentId).collection('pushSubscriptions').doc(subId).delete();

  return NextResponse.json({ success: true });
}
