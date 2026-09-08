import type { Metadata } from 'next';
import { getInstitutionBySlug } from '@/core/services/institutionService';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const institution = await getInstitutionBySlug(slug);

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
    alternates: {
      canonical: `/institutions/${institution.slug}`,
    },
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
  const institution = await getInstitutionBySlug(slug);

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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
