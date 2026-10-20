import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Applies to /tutors (the listing) only — /tutors/[slug] has its own layout.tsx that overrides
// this with a per-tutor canonical, since Next.js metadata merges child-over-parent.
export const metadata: Metadata = {
  alternates: localeAlternates('/tutors', 'ar'),
};

export default function TutorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
