import type { Metadata } from 'next';
import { getPublicJobBySlug } from '@/core/server/data/jobs';
import { getInstitutionById } from '@/core/services/institutionService';
import type { SupportedLanguage } from '@/core/types/masterData';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';
import { localeHref } from '@/lib/locale';
import { pickLocalized } from '@/lib/localized';
import { NOT_FOUND_TITLES, SEO_LABELS, localeAlternates } from '@/lib/seo';

// Metadata + JobPosting JSON-LD for a job in a given language. The /en and /ku layouts are thin
// wrappers around these; the Arabic layout predates them and keeps its own.
type Params = Promise<{ slug: string }>;

const EMPLOYMENT_TYPE_SCHEMA: Record<string, string> = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACTOR',
  INTERNSHIP: 'INTERN',
};

export async function jobMetadata(params: Params, language: SupportedLanguage): Promise<Metadata> {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) return { title: NOT_FOUND_TITLES[language].job };

  const title = pickLocalized(job.title, language);
  const description = pickLocalized(job.description, language);
  const path = `/jobs/${job.slug || job.id}`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
    alternates: localeAlternates(path, language),
  };
}

export async function JobSeoLayout({
  children,
  params,
  language,
}: {
  children: React.ReactNode;
  params: Params;
  language: SupportedLanguage;
}) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);
  if (!job) return children;

  const institution = job.institutionId ? await getInstitutionById(job.institutionId) : null;
  const orgName = (institution && pickLocalized(institution.name, language)) || job.posterName || 'Eduraq';
  const title = pickLocalized(job.title, language);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description: pickLocalized(job.description, language),
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

  const labels = SEO_LABELS[language];
  const breadcrumb = breadcrumbJsonLd([
    { name: labels.home, url: localeHref('/', language) },
    { name: labels.jobs, url: localeHref('/jobs', language) },
    { name: title, url: localeHref(`/jobs/${job.slug || job.id}`, language) },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
