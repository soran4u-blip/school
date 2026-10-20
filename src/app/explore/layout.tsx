import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Filter query params (?category=&governorate=&q=) shouldn't each be treated as a distinct page —
// point every variant back at the bare listing URL so Google doesn't dilute ranking across them.
export const metadata: Metadata = {
  alternates: localeAlternates('/explore', 'ar'),
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
