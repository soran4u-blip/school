import { localeAlternates } from '@/lib/seo';

// hreflang must be reciprocal: the /en and /ku versions of this page point here, so this one has to
// point back at them. Title and description are inherited from the root layout.
export const metadata = { alternates: localeAlternates('/trust', 'ar') };

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return children;
}
