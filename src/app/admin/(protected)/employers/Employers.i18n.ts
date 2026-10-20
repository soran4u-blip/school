import type { CopyDict } from '@/lib/useT';

// Strings for the employers admin page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const EMPLOYERS_COPY = {
  loadFailed: { ar: 'تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', en: 'Failed to load data. Make sure you are signed in as superadmin.', ku: 'نەتوانرا داتا باربکرێت. دڵنیابە وەک سوپەر ئەدمین چوویتە ژوورەوە.' },
  actionFailed: { ar: 'تعذر تنفيذ الإجراء', en: 'The action could not be completed', ku: 'نەتوانرا کردارەکە ئەنجام بدرێت' },
  title: { ar: 'الشركات والمنظمات', en: 'Companies & NGOs', ku: 'کۆمپانیا و ڕێکخراوەکان' },
  subtitle: { ar: 'حسابات الشركات والمنظمات غير الحكومية — يمكنها فقط نشر وإدارة الوظائف.', en: 'Employer accounts — can only post and manage job listings.', ku: 'هەژماری خاوەنکارەکان — تەنها دەتوانن هەلی کار بڵاوبکەنەوە و بەڕێوەی ببەن.' },
  name: { ar: 'الاسم', en: 'Name', ku: 'ناو' },
  typeGov: { ar: 'النوع والمحافظة', en: 'Type & Governorate', ku: 'جۆر و پارێزگا' },
  contact: { ar: 'التواصل', en: 'Contact', ku: 'پەیوەندی' },
  status: { ar: 'الحالة', en: 'Status', ku: 'دۆخ' },
  actions: { ar: 'إجراءات', en: 'Actions', ku: 'کردارەکان' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  empty: { ar: 'لا توجد حسابات بعد', en: 'No employer accounts yet', ku: 'هێشتا هیچ هەژمارێکی خاوەنکار نییە' },
  company: { ar: 'شركة', en: 'Company', ku: 'کۆمپانیا' },
  ngo: { ar: 'منظمة', en: 'NGO', ku: 'ڕێکخراو' },
  active: { ar: 'نشط', en: 'Active', ku: 'چالاک' },
  suspended: { ar: 'موقوف', en: 'Suspended', ku: 'ڕاگیراو' },
  delete: { ar: 'حذف', en: 'Delete', ku: 'سڕینەوە' },
  confirmDelete: { ar: 'حذف "{name}"؟ سيختفي فوراً، ويمكن استعادته من قسم المحذوفات خلال {days} يوماً.', en: `Delete "{name}"? It's hidden immediately and can be restored from "Deleted" for {days} days.`, ku: 'دەتەوێت "{name}" بسڕیتەوە؟ یەکسەر دەشاردرێتەوە و دەتوانرێت لە بەشی «سڕاوەکان» لە ماوەی {days} ڕۆژدا بگەڕێندرێتەوە.' },
} satisfies CopyDict;
