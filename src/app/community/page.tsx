import CommunityContent from './CommunityContent';

export const dynamic = 'force-dynamic';

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ governorate?: string | string[] }> }) {
  const params = await searchParams;
  return <CommunityContent initialGovernorate={typeof params.governorate === 'string' ? params.governorate : undefined} />;
}
