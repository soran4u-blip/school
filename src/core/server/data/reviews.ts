import { unstable_cache } from 'next/cache';
import { Review } from '@/core/types/review';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Approved reviews for a public profile page. Tagged with the profile's own collection so
// approving a review through /api/admin/reviews/[id] can invalidate the page it appears on at the
// same time as the rating aggregate it moved.

export const getPublicInstitutionReviews = unstable_cache(
  async (institutionId: string): Promise<Review[]> => {
    const snap = await requireAdminDb()
      .collection('reviews')
      .where('institutionId', '==', institutionId)
      .where('status', '==', 'APPROVED')
      .get();
    return snap.docs
      .map((d) => withId<Review>(d.id, d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  ['public-institution-reviews'],
  { tags: [CACHE_TAGS.institutions], revalidate: REVALIDATE_SECONDS }
);

export const getPublicTutorReviews = unstable_cache(
  async (tutorId: string): Promise<Review[]> => {
    const snap = await requireAdminDb()
      .collection('reviews')
      .where('tutorId', '==', tutorId)
      .where('status', '==', 'APPROVED')
      .get();
    return snap.docs
      .map((d) => withId<Review>(d.id, d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  ['public-tutor-reviews'],
  { tags: [CACHE_TAGS.tutors], revalidate: REVALIDATE_SECONDS }
);
