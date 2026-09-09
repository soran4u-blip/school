import type { Metadata } from 'next';
import { getPublicTutorBySlug } from '@/core/server/data/tutors';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getPublicTutorBySlug(slug);

  if (!tutor) {
    return { title: 'Tutor Not Found' };
  }

  const title = tutor.fullName.en;
  const description = tutor.title.en || tutor.bio.en;
  const path = `/tutors/${tutor.slug || tutor.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: tutor.photoUrl ? [tutor.photoUrl] : undefined,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: tutor.photoUrl ? [tutor.photoUrl] : undefined,
    },
    alternates: {
      canonical: `/en${path}`,
      languages: { 'ar-IQ': `${siteUrl}${path}`, en: `${siteUrl}/en${path}` },
    },
  };
}

export default async function TutorEnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutor = await getPublicTutorBySlug(slug);

  if (!tutor) {
    return children;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tutor.fullName.en,
    jobTitle: tutor.title.en || undefined,
    description: tutor.bio.en || undefined,
    image: tutor.photoUrl || undefined,
    ...(tutor.ratingAvg > 0 && tutor.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: tutor.ratingAvg,
            reviewCount: tutor.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/en' },
    { name: 'Tutors', url: '/en/tutors' },
    { name: tutor.fullName.en, url: `/en/tutors/${tutor.slug || tutor.id}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
