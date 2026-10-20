import type { CopyDict } from '@/lib/useT';

// Strings for the system errors page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ERRORS_COPY = {
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  title: { ar: 'أخطاء النظام', en: 'System Errors', ku: 'هەڵەکانی سیستەم' },
  subtitle: { ar: 'آخر 200 خطأ من العميل والخادم (مجمّعة حسب التكرار) — لا حاجة لخدمة مراقبة خارجية.', en: 'The last 200 client- and server-side errors, deduplicated by recurrence — no third-party monitoring service required.', ku: 'دوایین 200 هەڵەی لایەنی کڕیار و سێرڤەر (بەپێی دووبارەبوونەوە کۆکراونەتەوە) — پێویستی بە خزمەتگوزاری چاودێری دەرەکی نییە.' },
  all: { ar: 'الكل', en: 'All', ku: 'هەموو' },
  client: { ar: 'العميل', en: 'Client', ku: 'کڕیار' },
  server: { ar: 'الخادم', en: 'Server', ku: 'سێرڤەر' },
  empty: { ar: 'لا توجد أخطاء مسجلة', en: 'No errors logged', ku: 'هیچ هەڵەیەک تۆمار نەکراوە' },
  firstSeen: { ar: 'أول ظهور:', en: 'First seen:', ku: 'یەکەم جار بینرا:' },
} satisfies CopyDict;
