import { unstable_cache } from 'next/cache';
import { Tutor } from '@/core/types/tutor';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side reads of the public tutors directory — see ./cache.ts.

export const getActiveTutors = unstable_cache(
  async (): Promise<Tutor[]> => {
    const snap = await requireAdminDb().collection('tutors').where('status', '==', 'ACTIVE').get();
    return snap.docs.map((d) => withId<Tutor>(d.id, d.data()));
  },
  ['active-tutors'],
  { tags: [CACHE_TAGS.tutors], revalidate: REVALIDATE_SECONDS }
);

export const getPublicTutorBySlug = unstable_cache(
  async (slug: string): Promise<Tutor | null> => {
    const db = requireAdminDb();
    const bySlug = await db
      .collection('tutors')
      .where('slug', '==', slug)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return withId<Tutor>(d.id, d.data());
    }
    const byId = await db.collection('tutors').doc(slug).get();
    if (!byId.exists) return null;
    const tutor = withId<Tutor>(byId.id, byId.data()!);
    return tutor.status === 'ACTIVE' ? tutor : null;
  },
  ['public-tutor-by-slug'],
  { tags: [CACHE_TAGS.tutors], revalidate: REVALIDATE_SECONDS }
);
