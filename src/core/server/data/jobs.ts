import { Job } from '@/core/types/job';
import { todayLocalDate } from '@/lib/utils';
import { requireAdminDb, withId } from './cache';

// Jobs are created and published from the employer dashboard with the client SDK, so the
// server cannot invalidate a cached snapshot after each owner write. Read this small,
// time-sensitive directory directly so new postings and closures appear immediately.
function isPubliclyOpen(job: Job): boolean {
  return job.status === 'ACTIVE' && (!job.applicationDeadline || job.applicationDeadline >= todayLocalDate());
}

export async function getActiveJobs(): Promise<Job[]> {
  const snap = await requireAdminDb().collection('jobs').where('status', '==', 'ACTIVE').get();
  return snap.docs
    .map((d) => withId<Job>(d.id, d.data()))
    .filter(isPubliclyOpen)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPublicJobBySlug(slug: string): Promise<Job | null> {
  const db = requireAdminDb();
  const bySlug = await db
    .collection('jobs')
    .where('slug', '==', slug)
    .where('status', '==', 'ACTIVE')
    .limit(1)
    .get();
  if (!bySlug.empty) {
    const d = bySlug.docs[0];
    const job = withId<Job>(d.id, d.data());
    return isPubliclyOpen(job) ? job : null;
  }
  const byId = await db.collection('jobs').doc(slug).get();
  if (!byId.exists) return null;
  const job = withId<Job>(byId.id, byId.data()!);
  return isPubliclyOpen(job) ? job : null;
}
