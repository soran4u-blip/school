import type { Metadata } from 'next';
import { getPublicJobBySlug } from '@/core/server/data/jobs';
import { getInstitutionById } from '@/core/services/institutionService';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  const job = await getPublicJobBySlug(slug);

  if (!job) {
    return { title: 'Job Not Found' };
  }

  const title = job.title.en;
  const description = job.description.en;
  const path = `/jobs/${job.slug || job.id}`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
    alternates: {
      canonical: `/en${path}`,
      languages: { 'ar-IQ': `${siteUrl}${path}`, en: `${siteUrl}/en${path}` },
    },
  };
}

export default async function JobEnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);

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

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/en' },
    { name: 'Jobs', url: '/en/jobs' },
    { name: job.title.en, url: `/en/jobs/${job.slug || job.id}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
