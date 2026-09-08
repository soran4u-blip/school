import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import crypto from 'crypto';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { pushSubscribeSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';

// POST /api/push/subscribe — a logged-in student registers a browser push subscription. Doc id
// is a hash of the subscription endpoint, so re-subscribing the same browser/device just
// overwrites its own entry instead of accumulating duplicates.
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

  const parsed = await parseJsonBody(request, pushSubscribeSchema);
  if (parsed.error) return parsed.error;
  const { subscription } = parsed.data;

  const subId = crypto.createHash('sha256').update(subscription.endpoint).digest('hex').slice(0, 32);
  await adminDb
    .collection('students')
    .doc(studentId)
    .collection('pushSubscriptions')
    .doc(subId)
    .set({ subscription, createdAt: new Date().toISOString() });

  return NextResponse.json({ success: true });
}
