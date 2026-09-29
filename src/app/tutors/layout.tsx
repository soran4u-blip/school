import type { Metadata } from 'next';
import { siteUrl } from '@/lib/siteUrl';

// Applies to /tutors (the listing) only — /tutors/[slug] has its own layout.tsx that overrides
// this with a per-tutor canonical, since Next.js metadata merges child-over-parent.
export const metadata: Metadata = {
  alternates: {
    canonical: '/tutors',
    languages: { 'ar-IQ': `${siteUrl}/tutors`, en: `${siteUrl}/en/tutors` },
  },
};

export default function TutorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
