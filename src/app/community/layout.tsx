import type { Metadata } from 'next';

// Applies to /community (the listing) and /community/new — /community/[slug] has its own
// layout.tsx that overrides this with a per-post canonical, since Next.js metadata merges
// child-over-parent.
export const metadata: Metadata = {
  alternates: { canonical: '/community' },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
