import type { CopyDict } from '@/lib/useT';

// Strings for the job-application status lookup page. Sorani is a draft pending native review
// (see docs/ku-review-notes.md). Status codes (SUBMITTED, ...) are shown as-is.
export const MY_APPLICATIONS_COPY = {
  lookupFailed: { ar: 'تعذر البحث', en: 'Failed to look up your applications', ku: 'نەتوانرا گەڕان بکرێت' },
  title: { ar: 'طلبات التوظيف الخاصة بي', en: 'My Job Applications', ku: 'داواکاری دامەزراندنەکانم' },
  intro: { ar: 'أدخل رقم هاتفك لعرض حالة طلبات التوظيف الخاصة بك.', en: 'Enter your phone number to view the status of your job applications.', ku: 'ژمارەی تەلەفۆنەکەت بنووسە بۆ بینینی دۆخی داواکاری دامەزراندنەکانت.' },
  phone: { ar: 'رقم الهاتف', en: 'Phone number', ku: 'ژمارەی تەلەفۆن' },
  search: { ar: 'بحث', en: 'Search', ku: 'گەڕان' },
  empty: { ar: 'لا توجد طلبات بهذا الرقم', en: 'No applications found for this number', ku: 'هیچ داواکارییەک بەم ژمارەیە نەدۆزرایەوە' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', ku: 'واتسئاپ' },
} satisfies CopyDict;
