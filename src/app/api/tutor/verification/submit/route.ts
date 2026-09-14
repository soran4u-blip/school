import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { tutorVerificationSubmitSchema } from '@/core/validation/schemas';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';

// POST /api/tutor/verification/submit — a tutor asks the admin team to review their uploaded
// documents. Goes through the server (rather than the tutor writing the private doc's `status`
// directly, the way they already do for `documents`) so an owner can never walk their own request
// straight to APPROVED — firestore.rules also blocks that at the doc level, this is what actually
// flips PENDING on and mirrors it onto the public tutor doc for the admin queue.
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'tutor' || !user.tutorId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const tutorId = user.tutorId;

  const parsed = await parseJsonBody(request, tutorVerificationSubmitSchema);
  if (parsed.error) return parsed.error;
  const { documents } = parsed.data;

  try {
    const tutorRef = adminDb.collection('tutors').doc(tutorId);
    const tutorSnap = await tutorRef.get();
    if (!tutorSnap.exists) {
      return NextResponse.json({ success: false, error: 'Tutor not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await tutorRef.collection('private').doc('verification').set(
      { documents, status: 'PENDING', submittedAt: now },
      { merge: true }
    );
    await tutorRef.update({ verificationRequestStatus: 'PENDING', updatedAt: now });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification submission failed:', error);
    await logServerError('Verification submission failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not submit for review') }, { status: 500 });
  }
}
