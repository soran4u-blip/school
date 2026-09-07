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

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
