import { unstable_cache } from 'next/cache';
import { Institution } from '@/core/types/institution';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side reads of the public institutions directory. See ./cache.ts for why these are
// cached snapshots rather than per-request Firestore queries.

// Every ACTIVE institution. This is the snapshot the directory, explore and search pages filter
// over; one Firestore read serves all of them for the revalidate window.
export const getActiveInstitutions = unstable_cache(
  async (): Promise<Institution[]> => {
    const snap = await requireAdminDb().collection('institutions').where('status', '==', 'ACTIVE').get();
    // Filtered in-memory rather than with a second `where` — see the matching note in
    // core/server/data/tutors.ts.
    return snap.docs
      .map((d) => withId<Institution>(d.id, d.data()))
      .filter((i) => !i.isTestData);
  },
  ['active-institutions'],
  { tags: [CACHE_TAGS.institutions], revalidate: REVALIDATE_SECONDS }
);

// A single public profile. Cached per slug so a popular institution's page doesn't re-read on
// every hit, and so the detail page and its generateMetadata share one read rather than two.
export const getPublicInstitutionBySlug = unstable_cache(
  async (slug: string): Promise<Institution | null> => {
    const db = requireAdminDb();
    const bySlug = await db
      .collection('institutions')
      .where('slug', '==', slug)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return withId<Institution>(d.id, d.data());
    }
    // Institutions created before the slug field existed (or a stale bookmark) resolve by id.
    const byId = await db.collection('institutions').doc(slug).get();
    if (!byId.exists) return null;
    const institution = withId<Institution>(byId.id, byId.data()!);
    return institution.status === 'ACTIVE' ? institution : null;
  },
  ['public-institution-by-slug'],
  { tags: [CACHE_TAGS.institutions], revalidate: REVALIDATE_SECONDS }
);
