import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

// Filter query params (?category=&governorate=&q=) shouldn't each be treated as a distinct page —
// point every variant back at the bare listing URL so Google doesn't dilute ranking across them.
export const metadata: Metadata = {
  alternates: {
    canonical: '/explore',
    languages: { 'ar-IQ': `${siteUrl}/explore`, en: `${siteUrl}/en/explore` },
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
