import { notFound } from 'next/navigation';
import JobDetail from './JobDetail';
import { getPublicJobBySlug } from '@/core/server/data/jobs';
import { getPublicInstitutionBySlug } from '@/core/server/data/institutions';
import { getPublicGovernorates, getPublicTaxonomies } from '@/core/server/data/masterData';

// Server-rendered — see the note on /institutions/[slug]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) notFound();

  const [institution, governorates, taxonomies] = await Promise.all([
    // Institution ids are also document ids, and getPublicInstitutionBySlug falls back to an id
    // lookup, so this resolves an institution-posted job's owner without a second helper.
    job.institutionId ? getPublicInstitutionBySlug(job.institutionId) : Promise.resolve(null),
    getPublicGovernorates(),
    getPublicTaxonomies(),
  ]);

  return (
    <JobDetail
      job={job}
      institution={institution}
      governorate={governorates.find((g) => g.id === job.governorateId) || null}
      subjects={taxonomies.filter((tx) => tx.type === 'SUBJECT')}
    />
  );
}
