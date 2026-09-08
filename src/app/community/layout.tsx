import type { Metadata } from 'next';

// Applies to /community (the listing) and /community/new — /community/[slug] has its own
// layout.tsx that overrides this with a per-post canonical, since Next.js metadata merges
// child-over-parent. No /en mirror here (unlike institutions/tutors/jobs): posts are
// user-submitted, single-language content with no .en field at all — an /en/community/... URL
// would just show the identical Arabic text under an English-labeled page, which reads to
// Google as duplicate content rather than a genuine translation, so hreflang doesn't apply.
export const metadata: Metadata = {
  alternates: { canonical: '/community' },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
