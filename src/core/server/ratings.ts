import type { Firestore, Transaction, DocumentReference } from 'firebase-admin/firestore';
import { Review } from '@/core/types/review';

// Rating aggregates (`ratingAvg` / `reviewCount`) are denormalized onto the institution and tutor
// documents because every listing card, the explore rating filter, the sort order and the JSON-LD
// aggregateRating read them, and none of those can afford to count the reviews collection.
//
// Two rules make a denormalized counter safe, and the previous client-side implementation had
// neither: every transition that can change the value has to adjust it (approving a review used
// to bump the average, but un-approving or deleting one left it inflated forever), and the
// adjustment has to be atomic with the change that caused it (the old code did a read-all-then-
// write from the admin's browser, so two concurrent approvals lost one of the updates).
//
// The stored shape is a sum plus a count rather than just an average, so an approval is O(1)
// instead of a rescan. `ratingSum` didn't exist before this, so documents written earlier don't
// have one: applyReviewRatingDelta() detects that and recounts from the reviews collection inside
// the same transaction, which both produces the right answer and backfills the field. Once every
// document has been touched the recount path stops being reachable, but repairRatings() below
// stays as the deliberate way to rebuild from source if a counter is ever suspected of drifting.

export interface RatingAggregate {
  reviewCount: number;
  ratingSum: number;
  ratingAvg: number;
}

// Averages are shown to one decimal place everywhere in the UI, so they're stored that way too —
// otherwise the same number renders differently depending on which component rounded it.
function toAverage(sum: number, count: number): number {
  return count > 0 ? Number((sum / count).toFixed(1)) : 0;
}

export function ratingTarget(review: Pick<Review, 'tutorId' | 'institutionId'>):
  | { collection: 'tutors'; id: string; field: 'tutorId' }
  | { collection: 'institutions'; id: string; field: 'institutionId' }
  | null {
  if (review.tutorId) return { collection: 'tutors', id: review.tutorId, field: 'tutorId' };
  if (review.institutionId) return { collection: 'institutions', id: review.institutionId, field: 'institutionId' };
  return null;
}

// Institutions nest their aggregates under `metrics`; tutors keep them at the top level. Both
// shapes are baked into public types and JSON-LD output, so this maps rather than unifies them.
function readStored(collection: 'tutors' | 'institutions', data: Record<string, unknown> | undefined) {
  if (!data) return { count: undefined, sum: undefined };
  if (collection === 'tutors') {
    return { count: data.reviewCount as number | undefined, sum: data.ratingSum as number | undefined };
  }
  const metrics = (data.metrics || {}) as Record<string, unknown>;
  return { count: metrics.reviewCount as number | undefined, sum: metrics.ratingSum as number | undefined };
}

function writeFields(collection: 'tutors' | 'institutions', agg: RatingAggregate): Record<string, unknown> {
  if (collection === 'tutors') {
    return { reviewCount: agg.reviewCount, ratingSum: agg.ratingSum, ratingAvg: agg.ratingAvg };
  }
  // Dotted paths so the rest of `metrics` (studentsCount, graduateEmploymentRate) survives.
  return {
    'metrics.reviewCount': agg.reviewCount,
    'metrics.ratingSum': agg.ratingSum,
    'metrics.ratingAvg': agg.ratingAvg,
  };
}

// Sum and count of every currently-APPROVED review for a target, read from the reviews collection
// itself. Inside a transaction this reflects state before any write in that transaction.
async function countApproved(
  db: Firestore,
  tx: Transaction | null,
  field: 'tutorId' | 'institutionId',
  targetId: string
): Promise<{ count: number; sum: number }> {
  const query = db.collection('reviews').where(field, '==', targetId).where('status', '==', 'APPROVED');
  const snap = tx ? await tx.get(query) : await query.get();
  let sum = 0;
  snap.docs.forEach((d) => {
    sum += (d.data() as Review).rating || 0;
  });
  return { count: snap.size, sum };
}

/**
 * Adjusts a target's aggregates by one review entering (+1) or leaving (-1) the approved set.
 * Must be called inside the same transaction as the review write it accounts for.
 */
export async function applyReviewRatingDelta(
  db: Firestore,
  tx: Transaction,
  review: Review,
  delta: 1 | -1
): Promise<void> {
  const target = ratingTarget(review);
  if (!target) return;

  const targetRef: DocumentReference = db.collection(target.collection).doc(target.id);
  const targetSnap = await tx.get(targetRef);
  if (!targetSnap.exists) return; // target deleted out from under the review; nothing to maintain

  const stored = readStored(target.collection, targetSnap.data());
  // A document that predates `ratingSum` can't be adjusted incrementally — recount it from the
  // reviews collection instead, which backfills the field as a side effect.
  const base =
    typeof stored.sum === 'number' && typeof stored.count === 'number'
      ? { count: stored.count, sum: stored.sum }
      : await countApproved(db, tx, target.field, target.id);

  // Math.max guards against a counter that already drifted negative; repairRatings() is the fix
  // for that, but a moderation action shouldn't be the thing that throws because of it.
  const reviewCount = Math.max(0, base.count + delta);
  const ratingSum = Math.max(0, base.sum + delta * (review.rating || 0));

  tx.update(targetRef, writeFields(target.collection, { reviewCount, ratingSum, ratingAvg: toAverage(ratingSum, reviewCount) }));
}

/**
 * Rebuilds every institution's and tutor's aggregates from the reviews collection. This is the
 * repair path: denormalized counters need one, because any bug, partial failure or out-of-band
 * write puts them out of step with the source of truth and nothing else will ever notice.
 * Returns the documents it actually had to change.
 */
export async function repairRatings(db: Firestore): Promise<{ repaired: string[]; checked: number }> {
  const repaired: string[] = [];
  let checked = 0;

  // One pass over reviews rather than two queries per target: the collection is small relative to
  // the number of targets, and this keeps the job O(reviews + targets) instead of O(targets × reviews).
  const approved = await db.collection('reviews').where('status', '==', 'APPROVED').get();
  const totals = new Map<string, { count: number; sum: number }>();
  approved.docs.forEach((d) => {
    const review = d.data() as Review;
    const target = ratingTarget(review);
    if (!target) return;
    const key = `${target.collection}/${target.id}`;
    const entry = totals.get(key) || { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += review.rating || 0;
    totals.set(key, entry);
  });

  for (const collection of ['institutions', 'tutors'] as const) {
    const snap = await db.collection(collection).get();
    for (const docSnap of snap.docs) {
      checked += 1;
      const actual = totals.get(`${collection}/${docSnap.id}`) || { count: 0, sum: 0 };
      const stored = readStored(collection, docSnap.data());
      if (stored.count === actual.count && stored.sum === actual.sum) continue;
      await docSnap.ref.update(
        writeFields(collection, {
          reviewCount: actual.count,
          ratingSum: actual.sum,
          ratingAvg: toAverage(actual.sum, actual.count),
        })
      );
      repaired.push(`${collection}/${docSnap.id}`);
    }
  }

  return { repaired, checked };
}
