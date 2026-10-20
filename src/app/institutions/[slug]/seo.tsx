import type { Metadata } from 'next';
import { getPublicInstitutionBySlug } from '@/core/server/data/institutions';
import type { SupportedLanguage } from '@/core/types/masterData';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';
import { localeHref } from '@/lib/locale';
import { pickLocalized } from '@/lib/localized';
import { NOT_FOUND_TITLES, SEO_LABELS, localeAlternates } from '@/lib/seo';

// Metadata + JSON-LD for an institution profile in a given language. The /en and /ku layouts are
// thin wrappers around these; the Arabic layout predates them and keeps its own.
type Params = Promise<{ slug: string }>;

export async function institutionMetadata(params: Params, language: SupportedLanguage): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getPublicInstitutionBySlug(slug);
  if (!institution) return { title: NOT_FOUND_TITLES[language].institution };

  const title = pickLocalized(institution.name, language);
  const description = pickLocalized(institution.tagline, language) || pickLocalized(institution.description, language);
  const path = `/institutions/${institution.slug}`;
  const images = institution.coverImageUrl ? [institution.coverImageUrl] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images },
    alternates: localeAlternates(path, language),
  };
}

export async function InstitutionSeoLayout({
  children,
  params,
  language,
}: {
  children: React.ReactNode;
  params: Params;
  language: SupportedLanguage;
}) {
  const { slug } = await params;
  const institution = await getPublicInstitutionBySlug(slug);
  if (!institution) return children;

  const name = pickLocalized(institution.name, language);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name,
    description: pickLocalized(institution.description, language) || pickLocalized(institution.tagline, language),
    logo: institution.logoUrl || undefined,
    image: institution.coverImageUrl || undefined,
    telephone: institution.contact.phonePrimary || undefined,
    email: institution.contact.email || undefined,
    url: institution.contact.website || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IQ',
      addressRegion: institution.governorateId,
      streetAddress: pickLocalized(institution.address, language) || undefined,
    },
    ...(institution.metrics.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: institution.metrics.ratingAvg,
        reviewCount: institution.metrics.reviewCount,
      },
    }),
  };

  const labels = SEO_LABELS[language];
  const breadcrumb = breadcrumbJsonLd([
    { name: labels.home, url: localeHref('/', language) },
    { name: labels.explore, url: localeHref('/explore', language) },
    { name, url: localeHref(`/institutions/${institution.slug}`, language) },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
