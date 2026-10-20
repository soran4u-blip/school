import type { Metadata } from 'next';
import { localeAlternates } from '@/lib/seo';

// Draft Sorani copy — pending native-speaker review (see docs/ku-review-notes.md).
const title = 'پلاتفۆرمی دۆزینەوەی پەروەردەی عێراق';
const description = 'قوتابخانە، زانکۆ، پەیمانگا و مامۆستای تایبەت لە سەرانسەری عێراق بدۆزەرەوە و بەراوردیان بکە. هەڵسەنگاندنەکان بخوێنەرەوە و لە کۆمەڵگاکەت بپرسە — پێش ئەوەی بڕیار بدەیت.';

// Kurdish (Sorani) mirror of the same public route groups as /en. Language comes from the
// pathname (see src/core/context/LanguageContext.tsx), so there is no provider here. Nested
// layouts override this title/description/canonical for their own segment.
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image', title, description },
  alternates: localeAlternates('/', 'ku'),
};

export default function KurdishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
