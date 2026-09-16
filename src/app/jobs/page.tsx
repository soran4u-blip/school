import JobsList from './JobsList';
import { getActiveJobs } from '@/core/server/data/jobs';
import { getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ governorate?: string | string[] }> }) {
  const [jobs, governorates, taxonomies] = await Promise.all([
    getActiveJobs(),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);
  const params = await searchParams;
  const initialGovernorate = typeof params.governorate === 'string' ? params.governorate : undefined;

  return <JobsList jobs={jobs} governorates={governorates} subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')} initialGovernorate={initialGovernorate} />;
}
