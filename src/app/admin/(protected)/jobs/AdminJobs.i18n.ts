import type { CopyDict } from '@/lib/useT';

// Strings for the all-jobs admin page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ADMIN_JOBS_COPY = {
  loadFailed: { ar: 'تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', en: 'Failed to load data. Make sure you are signed in as superadmin.', ku: 'نەتوانرا داتا باربکرێت. دڵنیابە وەک سوپەر ئەدمین چوویتە ژوورەوە.' },
  title: { ar: 'كافة الوظائف الشاغرة', en: 'All Job Postings', ku: 'هەموو هەلە کارییەکان' },
  subtitle: { ar: 'نظرة شاملة على وظائف كل المؤسسات والشركات والمنظمات على المنصة.', en: 'A platform-wide view across every institution, company, and NGO job posting.', ku: 'دیمەنێکی گشتی لە هەلە کارییەکانی هەموو دامەزراوە، کۆمپانیا و ڕێکخراوەکانی پلاتفۆرم.' },
  allPosters: { ar: 'كافة الجهات', en: 'All Posters', ku: 'هەموو لایەنەکان' },
  results: { ar: 'النتائج:', en: 'Results:', ku: 'ئەنجامەکان:' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  empty: { ar: 'لا توجد وظائف بعد', en: 'No jobs yet', ku: 'هێشتا هیچ هەلێکی کار نییە' },
  ngo: { ar: 'منظمة', en: 'NGO', ku: 'ڕێکخراو' },
  company: { ar: 'شركة', en: 'Company', ku: 'کۆمپانیا' },
  applicants: { ar: 'متقدم', en: 'applicants', ku: 'داواکار' },
  viewJob: { ar: 'عرض الوظيفة', en: 'View Job', ku: 'بینینی هەلی کار' },
} satisfies CopyDict;
