import { unstable_cache } from 'next/cache';
import { CommunityPost } from '@/core/types/community';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side read of the approved community board — see ./cache.ts.

export const getPublicCommunityPosts = unstable_cache(
  async (): Promise<CommunityPost[]> => {
    const snap = await requireAdminDb().collection('communityPosts').where('status', '==', 'APPROVED').get();
    return snap.docs
      .map((d) => withId<CommunityPost>(d.id, d.data()))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  ['public-community-posts'],
  { tags: [CACHE_TAGS.community], revalidate: REVALIDATE_SECONDS }
);
