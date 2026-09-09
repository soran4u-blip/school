import { unstable_cache } from 'next/cache';
import { Job } from '@/core/types/job';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side reads of the public jobs board — see ./cache.ts.

export const getActiveJobs = unstable_cache(
  async (): Promise<Job[]> => {
    const snap = await requireAdminDb().collection('jobs').where('status', '==', 'ACTIVE').get();
    return snap.docs
      .map((d) => withId<Job>(d.id, d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  ['active-jobs'],
  { tags: [CACHE_TAGS.jobs], revalidate: REVALIDATE_SECONDS }
);

export const getPublicJobBySlug = unstable_cache(
  async (slug: string): Promise<Job | null> => {
    const db = requireAdminDb();
    const bySlug = await db
      .collection('jobs')
      .where('slug', '==', slug)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();
    if (!bySlug.empty) {
      const d = bySlug.docs[0];
      return withId<Job>(d.id, d.data());
    }
    const byId = await db.collection('jobs').doc(slug).get();
    if (!byId.exists) return null;
    const job = withId<Job>(byId.id, byId.data()!);
    return job.status === 'ACTIVE' ? job : null;
  },
  ['public-job-by-slug'],
  { tags: [CACHE_TAGS.jobs], revalidate: REVALIDATE_SECONDS }
);
