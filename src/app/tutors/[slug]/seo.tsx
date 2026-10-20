import type { Metadata } from 'next';
import { getPublicTutorBySlug } from '@/core/server/data/tutors';
import type { SupportedLanguage } from '@/core/types/masterData';
import { breadcrumbJsonLd } from '@/lib/breadcrumb';
import { localeHref } from '@/lib/locale';
import { pickLocalized } from '@/lib/localized';
import { NOT_FOUND_TITLES, SEO_LABELS, localeAlternates } from '@/lib/seo';

// Metadata + JSON-LD for a tutor profile in a given language. The /en and /ku layouts are thin
// wrappers around these; the Arabic layout predates them and keeps its own.
type Params = Promise<{ slug: string }>;

export async function tutorMetadata(params: Params, language: SupportedLanguage): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getPublicTutorBySlug(slug);
  if (!tutor) return { title: NOT_FOUND_TITLES[language].tutor };

  const title = pickLocalized(tutor.fullName, language);
  const description = pickLocalized(tutor.title, language) || pickLocalized(tutor.bio, language);
  const path = `/tutors/${tutor.slug || tutor.id}`;
  const images = tutor.photoUrl ? [tutor.photoUrl] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images, type: 'profile' },
    twitter: { card: 'summary_large_image', title, description, images },
    alternates: localeAlternates(path, language),
  };
}

export async function TutorSeoLayout({
  children,
  params,
  language,
}: {
  children: React.ReactNode;
  params: Params;
  language: SupportedLanguage;
}) {
  const { slug } = await params;
  const tutor = await getPublicTutorBySlug(slug);
  if (!tutor) return children;

  const name = pickLocalized(tutor.fullName, language);
  const jobTitle = pickLocalized(tutor.title, language);
  const bio = pickLocalized(tutor.bio, language);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: jobTitle || undefined,
    description: bio || undefined,
    image: tutor.photoUrl || undefined,
    ...(tutor.ratingAvg > 0 && tutor.reviewCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: tutor.ratingAvg, reviewCount: tutor.reviewCount } }
      : {}),
  };

  const labels = SEO_LABELS[language];
  const breadcrumb = breadcrumbJsonLd([
    { name: labels.home, url: localeHref('/', language) },
    { name: labels.tutors, url: localeHref('/tutors', language) },
    { name, url: localeHref(`/tutors/${tutor.slug || tutor.id}`, language) },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {children}
    </>
  );
}
