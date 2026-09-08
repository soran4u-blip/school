import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
