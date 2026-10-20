import type { Metadata } from 'next';
import { tutorMetadata, TutorSeoLayout } from '@/app/tutors/[slug]/seo';

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return tutorMetadata(params, 'en');
}

export default function TutorEnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return <TutorSeoLayout params={params} language="en">{children}</TutorSeoLayout>;
}
