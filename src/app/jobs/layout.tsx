import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Applies to /jobs (the listing) only — /jobs/[slug] has its own layout.tsx that overrides
// this with a per-job canonical, since Next.js metadata merges child-over-parent.
export const metadata: Metadata = {
  alternates: localeAlternates('/jobs', 'ar'),
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
