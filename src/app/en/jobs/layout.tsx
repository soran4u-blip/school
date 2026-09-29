import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Education Jobs in Iraq',
  alternates: {
    canonical: '/en/jobs',
    languages: { 'ar-IQ': `${siteUrl}/jobs`, en: `${siteUrl}/en/jobs` },
  },
};

export default function JobsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
