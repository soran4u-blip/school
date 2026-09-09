import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { reviewModerationSchema } from '@/core/validation/schemas';
import { applyReviewRatingDelta } from '@/core/server/ratings';
import { revalidatePublicData } from '@/core/server/data/cache';
import { recordAuditEvent } from '@/core/server/auditLog';
import { logServerError } from '@/core/server/errorLog';
import { Review } from '@/core/types/review';

// Review moderation. This has to be a server route rather than a client-SDK write from
// /admin/reviews, because changing a review's status also has to move the reviewed party's
// rating aggregates, and the two must happen in one transaction — see src/core/server/ratings.ts.
// firestore.rules denies client updates to `status` and client deletes outright to keep this the
// only way in.

// PATCH /api/admin/reviews/[id] — approve, reject, or send a review back to pending.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'reviews:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const parsed = await parseJsonBody(request, reviewModerationSchema);
  if (parsed.error) return parsed.error;
  const { status } = parsed.data;

  const { id } = await params;
  const ref = db.collection('reviews').doc(id);

  try {
    const updated = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return null;
      const review = { ...(snap.data() as Review), id: snap.id };

      if (review.status !== status) {
        // Only crossing the APPROVED boundary changes what the aggregates should say.
        if (review.status === 'APPROVED') await applyReviewRatingDelta(db, tx, review, -1);
        else if (status === 'APPROVED') await applyReviewRatingDelta(db, tx, review, 1);
        tx.update(ref, { status });
      }

      return { ...review, status };
    });

    if (!updated) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    // The profile page shows the review and the aggregate it just moved — don't make a moderator
    // wait out the revalidate window to see their own decision take effect.
    await recordAuditEvent(db, {
      actor: user,
      action: 'review.moderate',
      targetType: 'review',
      targetId: id,
      summary: `Set review by "${updated.reviewerName}" to ${status}`,
      metadata: { status, rating: updated.rating },
      request,
    });
    revalidatePublicData('institutions', 'tutors');
    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    const err = error as Error;
    console.error('Review moderation failed:', err);
    await logServerError('Review moderation failed', { stack: err?.stack, url: request.url });
    return NextResponse.json({ success: false, error: 'Could not update the review — safe to retry' }, { status: 500 });
  }
}

// DELETE /api/admin/reviews/[id] — removing an approved review has to take its rating with it,
// which is exactly the case the old client-side flow missed.
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'reviews:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { id } = await params;
  const ref = db.collection('reviews').doc(id);

  try {
    const deleted = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return false;
      const review = { ...(snap.data() as Review), id: snap.id };
      if (review.status === 'APPROVED') await applyReviewRatingDelta(db, tx, review, -1);
      tx.delete(ref);
      return true;
    });

    if (!deleted) return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    await recordAuditEvent(db, {
      actor: user,
      action: 'review.delete',
      targetType: 'review',
      targetId: id,
      summary: 'Deleted a review',
      request,
    });
    revalidatePublicData('institutions', 'tutors');
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('Review deletion failed:', err);
    await logServerError('Review deletion failed', { stack: err?.stack, url: request.url });
    return NextResponse.json({ success: false, error: 'Could not delete the review — safe to retry' }, { status: 500 });
  }
}
