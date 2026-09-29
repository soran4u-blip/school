import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

export const metadata: Metadata = {
  title: 'Explore Schools, Universities & Institutes',
  alternates: {
    canonical: '/en/explore',
    languages: { 'ar-IQ': `${siteUrl}/explore`, en: `${siteUrl}/en/explore` },
  },
};

export default function ExploreEnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
