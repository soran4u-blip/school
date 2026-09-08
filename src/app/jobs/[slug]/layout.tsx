import type { Metadata } from 'next';
import { getJobBySlug } from '@/core/services/jobService';
import { getInstitutionById } from '@/core/services/institutionService';

const EMPLOYMENT_TYPE_SCHEMA: Record<string, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERN',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return {
      title: 'Job Not Found',
    };
  }

  const title = job.title.en;
  const description = job.description.en;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `/jobs/${job.slug || job.id}`,
    },
  };
}

export default async function JobLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    return children;
  }

  const institution = job.institutionId ? await getInstitutionById(job.institutionId) : null;
  const orgName = institution?.name.en || job.posterName || 'Eduraq';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title.en,
    description: job.description.en,
    datePosted: job.createdAt,
    ...(job.applicationDeadline && { validThrough: `${job.applicationDeadline}T23:59:59` }),
    employmentType: EMPLOYMENT_TYPE_SCHEMA[job.employmentType],
    hiringOrganization: {
      '@type': 'Organization',
      name: orgName,
      ...(institution?.logoUrl && { logo: institution.logoUrl }),
    },
    jobLocationType: job.isRemote ? 'TELECOMMUTE' : undefined,
    ...(!job.isRemote && {
      jobLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressCountry: 'IQ', addressRegion: job.governorateId },
      },
    }),
    ...(job.salaryMin && job.salaryMax && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: job.salaryCurrency || 'USD',
        value: { '@type': 'QuantitativeValue', minValue: job.salaryMin, maxValue: job.salaryMax, unitText: 'MONTH' },
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
