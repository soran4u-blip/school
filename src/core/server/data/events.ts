import { EduEvent } from '@/core/types/event';
import { requireAdminDb, withId } from './cache';

// Events are created and published from the institution/employer dashboard with the client SDK,
// so the server cannot invalidate a cached snapshot after each owner write. Read this small,
// time-sensitive directory directly so newly published events appear immediately — same
// reasoning as getActiveJobs()/getPublicJobBySlug() in ./jobs.ts.

export async function getActiveEvents(): Promise<EduEvent[]> {
  const snap = await requireAdminDb().collection('events').where('status', '==', 'ACTIVE').get();
  return snap.docs
    .map((d) => withId<EduEvent>(d.id, d.data()))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getPublicEventBySlug(slug: string): Promise<EduEvent | null> {
  const db = requireAdminDb();
  const bySlug = await db
    .collection('events')
    .where('slug', '==', slug)
    .where('status', '==', 'ACTIVE')
    .limit(1)
    .get();
  if (!bySlug.empty) {
    const d = bySlug.docs[0];
    return withId<EduEvent>(d.id, d.data());
  }
  const byId = await db.collection('events').doc(slug).get();
  if (!byId.exists) return null;
  const event = withId<EduEvent>(byId.id, byId.data()!);
  return event.status === 'ACTIVE' ? event : null;
}
