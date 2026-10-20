import type { Metadata } from 'next';
import { institutionMetadata, InstitutionSeoLayout } from '@/app/institutions/[slug]/seo';

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return institutionMetadata(params, 'en');
}

export default function InstitutionEnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return <InstitutionSeoLayout params={params} language="en">{children}</InstitutionSeoLayout>;
}
