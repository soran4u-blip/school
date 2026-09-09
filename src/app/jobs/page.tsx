import JobsList from './JobsList';
import { getActiveJobs } from '@/core/server/data/jobs';
import { getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const [jobs, governorates, taxonomies] = await Promise.all([
    getActiveJobs(),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);

  return <JobsList jobs={jobs} governorates={governorates} subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')} />;
}
