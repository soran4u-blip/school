import type { CopyDict } from '@/lib/useT';

// Strings for the all-bookings page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const BOOKINGS_COPY = {
  loadFailed: { ar: 'تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', en: 'Failed to load data. Make sure you are signed in as superadmin.', ku: 'نەتوانرا داتا باربکرێت. دڵنیابە وەک سوپەر ئەدمین چوویتە ژوورەوە.' },
  title: { ar: 'كافة الحجوزات', en: 'All Bookings', ku: 'هەموو حیجزەکان' },
  subtitle: { ar: 'نظرة شاملة على حجوزات كل الأساتذة الخصوصيين في المنصة.', en: 'A platform-wide view across every tutor\'s bookings.', ku: 'دیمەنێکی گشتی لە حیجزەکانی هەموو مامۆستا تایبەتەکانی پلاتفۆرم.' },
  allTutors: { ar: 'كافة الأساتذة', en: 'All Tutors', ku: 'هەموو مامۆستایان' },
  results: { ar: 'النتائج:', en: 'Results:', ku: 'ئەنجامەکان:' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  empty: { ar: 'لا توجد حجوزات بعد', en: 'No bookings yet', ku: 'هێشتا هیچ حیجزێک نییە' },
  individual: { ar: 'فردي', en: 'Individual', ku: 'تاک' },
  student: { ar: 'طالب', en: 'student', ku: 'قوتابی' },
  group: { ar: 'مجموعة ({count}/{max})', en: 'Group ({count}/{max})', ku: 'گرووپ ({count}/{max})' },
} satisfies CopyDict;
