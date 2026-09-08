import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
