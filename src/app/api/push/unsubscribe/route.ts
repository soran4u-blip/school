import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import crypto from 'crypto';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { pushUnsubscribeSchema } from '@/core/validation/schemas';


// POST /api/push/unsubscribe — removes this browser's subscription for the logged-in student.
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const studentId = user.uid;

  const parsed = await parseJsonBody(request, pushUnsubscribeSchema);
  if (parsed.error) return parsed.error;
  const { endpoint } = parsed.data;

  const subId = crypto.createHash('sha256').update(endpoint).digest('hex').slice(0, 32);
  await adminDb.collection('students').doc(studentId).collection('pushSubscriptions').doc(subId).delete();

  return NextResponse.json({ success: true });
}
