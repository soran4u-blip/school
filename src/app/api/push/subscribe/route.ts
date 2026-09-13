import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import crypto from 'crypto';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { pushSubscribeSchema } from '@/core/validation/schemas';


// POST /api/push/subscribe — a logged-in student or tutor registers a browser push subscription.
// Doc id is a hash of the subscription endpoint, so re-subscribing the same browser/device just
// overwrites its own entry instead of accumulating duplicates.
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  const ownerId =
    user?.role === 'student' ? user.uid :
    user?.role === 'tutor' ? user.tutorId :
    user?.role === 'institution' ? user.institutionId :
    user?.role === 'employer' ? user.employerId :
    user?.uid || null;

  if (!ownerId || !user?.role) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const collectionName =
    user.role === 'student' ? 'students' :
    user.role === 'tutor' ? 'tutors' :
    user.role === 'institution' ? 'institutions' :
    user.role === 'employer' ? 'employers' : 'users';

  const parsed = await parseJsonBody(request, pushSubscribeSchema);
  if (parsed.error) return parsed.error;
  const { subscription } = parsed.data;

  const subId = crypto.createHash('sha256').update(subscription.endpoint).digest('hex').slice(0, 32);
  await adminDb
    .collection(collectionName)
    .doc(ownerId)
    .collection('pushSubscriptions')
    .doc(subId)
    .set({ subscription, createdAt: new Date().toISOString() });

  return NextResponse.json({ success: true });
}
