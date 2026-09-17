import CommunityContent from './CommunityContent';
import { getPublicCommunityPosts } from '@/core/server/data/community';
import { getPublicGovernorates } from '@/core/server/data/masterData';
import { CommunityPost } from '@/core/types/community';
import { Governorate } from '@/core/types/masterData';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ governorate?: string | string[] }> }) {
  const params = await searchParams;
  const initialGovernorate = typeof params.governorate === 'string' ? params.governorate : undefined;

  let initialPosts: CommunityPost[] | undefined = undefined;
  let initialGovernorates: Governorate[] | undefined = undefined;

  try {
    const [posts, govs] = await Promise.all([
      getPublicCommunityPosts().catch(() => []),
      getPublicGovernorates().catch(() => []),
    ]);
    if (posts && posts.length > 0) initialPosts = posts;
    if (govs && govs.length > 0) initialGovernorates = govs;
  } catch {
    // Falls back to client fetch or sample data in CommunityContent
  }

  return (
    <CommunityContent
      initialGovernorate={initialGovernorate}
      initialPosts={initialPosts}
      initialGovernorates={initialGovernorates}
    />
  );
}
