import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Applies to /jobs (the listing) only — /jobs/[slug] has its own layout.tsx that overrides
// this with a per-job canonical, since Next.js metadata merges child-over-parent.
export const metadata: Metadata = {
  alternates: {
    canonical: '/jobs',
    languages: { 'ar-IQ': `${siteUrl}/jobs`, en: `${siteUrl}/en/jobs` },
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
