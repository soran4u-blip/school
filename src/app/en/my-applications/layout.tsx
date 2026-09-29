import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

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
