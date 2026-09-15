import { unstable_cache } from 'next/cache';
import { EduEvent } from '@/core/types/event';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side reads of the public events board — see ./cache.ts.

export const getActiveEvents = unstable_cache(
  async (): Promise<EduEvent[]> => {
    const snap = await requireAdminDb().collection('events').where('status', '==', 'ACTIVE').get();
    return snap.docs
      .map((d) => withId<EduEvent>(d.id, d.data()))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },
  ['active-events'],
  { tags: [CACHE_TAGS.events], revalidate: REVALIDATE_SECONDS }
);

export const getPublicEventBySlug = unstable_cache(
  async (slug: string): Promise<EduEvent | null> => {
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
  },
  ['public-event-by-slug'],
  { tags: [CACHE_TAGS.events], revalidate: REVALIDATE_SECONDS }
);
