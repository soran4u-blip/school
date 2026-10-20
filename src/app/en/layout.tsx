import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

const title = "Iraq's Education Discovery Platform";
const description = 'Discover and compare schools, universities, institutes, and private tutors across Iraq. Read reviews, ask your community — before you decide.';

// English mirror of the public route groups that exist per language (home, explore, tutors, jobs,
// events, institutions, trust, login, my-applications — not community, see
// src/app/community/layout.tsx for why). Arabic stays unprefixed at its existing, already-indexed
// URLs; this subtree is purely additive.
//
// No LanguageProvider here: the single root-level provider (src/core/context/LanguageContext.tsx)
// derives its language from the pathname itself, since it stays mounted across every client-side
// navigation (a second nested provider was tried and reverted — see that file's comment).
//
// Each nested layout below overrides this one's title/description/canonical for its own segment;
// what's left here only actually applies to the bare /en route (the home page), since it has no
// deeper layout of its own to override it.
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
  alternates: localeAlternates('/', 'en'),
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
