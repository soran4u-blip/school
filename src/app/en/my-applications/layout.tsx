import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'My Job Applications',
  alternates: {
    canonical: '/en/my-applications',
    languages: { 'ar-IQ': `${siteUrl}/my-applications`, en: `${siteUrl}/en/my-applications` },
  },
};

export default function MyApplicationsEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
