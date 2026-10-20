import type { Metadata } from 'next';
import { getPublicInstitutionBySlug } from '@/core/server/data/institutions';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';
import { localeAlternates } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getPublicInstitutionBySlug(slug);

  if (!institution) {
    return {
      title: 'Institution Not Found',
    };
  }

  const title = institution.name.en;
  const description = institution.tagline.en || institution.description.en;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: institution.coverImageUrl ? [institution.coverImageUrl] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: institution.coverImageUrl ? [institution.coverImageUrl] : undefined,
    },
    alternates: localeAlternates(`/institutions/${institution.slug}`, 'ar'),
  };
}

export default async function InstitutionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const institution = await getPublicInstitutionBySlug(slug);

  if (!institution) {
    return children;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: institution.name.en,
    description: institution.description.en || institution.tagline.en,
    logo: institution.logoUrl || undefined,
    image: institution.coverImageUrl || undefined,
    telephone: institution.contact.phonePrimary || undefined,
    email: institution.contact.email || undefined,
    url: institution.contact.website || undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IQ',
      addressRegion: institution.governorateId,
      streetAddress: institution.address.en || undefined,
    },
    ...(institution.metrics.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: institution.metrics.ratingAvg,
        reviewCount: institution.metrics.reviewCount,
      },
    }),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Explore', url: '/explore' },
    { name: institution.name.en, url: `/institutions/${institution.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
