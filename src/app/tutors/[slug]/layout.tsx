import type { Metadata } from 'next';
import { getTutorBySlug } from '@/core/services/tutorService';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getTutorBySlug(slug);

  if (!tutor) {
    return {
      title: 'Tutor Not Found',
    };
  }

  const title = tutor.fullName.en;
  const description = tutor.title.en || tutor.bio.en;

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
      canonical: `/tutors/${tutor.slug || tutor.id}`,
      languages: {
        'ar-IQ': `${siteUrl}/tutors/${tutor.slug || tutor.id}`,
        en: `${siteUrl}/en/tutors/${tutor.slug || tutor.id}`,
      },
    },
  };
}

export default async function TutorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutor = await getTutorBySlug(slug);

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
    { name: 'Home', url: '/' },
    { name: 'Tutors', url: '/tutors' },
    { name: tutor.fullName.en, url: `/tutors/${tutor.slug || tutor.id}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
