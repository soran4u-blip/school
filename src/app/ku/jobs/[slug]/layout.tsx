import type { Metadata } from 'next';
import { jobMetadata, JobSeoLayout } from '@/app/jobs/[slug]/seo';

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return jobMetadata(params, 'ku');
}

export default function JobKuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return <JobSeoLayout params={params} language="ku">{children}</JobSeoLayout>;
}
