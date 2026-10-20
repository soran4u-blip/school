import type { CopyDict } from '@/lib/useT';

// Strings for the institutions admin table. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ADMIN_INSTITUTIONS_COPY = {
  actionFailed: { ar: 'تعذر تنفيذ الإجراء', en: 'The action could not be completed', ku: 'نەتوانرا کردارەکە ئەنجام بدرێت' },
  title: { ar: 'إدارة المؤسسات التعليمية المسجلة', en: 'Educational Institutions Directory', ku: 'بەڕێوەبردنی دامەزراوە پەروەردەییە تۆمارکراوەکان' },
  subtitle: { ar: 'اعتماد وتوثيق المدارس والجامعات والمعاهد، تفعيل الشارات الرسمية، وإدارة برامج القبول.', en: 'Verify institution credentials, toggle official badges, and manage listings.', ku: 'پەسەندکردن و پشتڕاستکردنەوەی قوتابخانە، زانکۆ و پەیمانگاکان، چالاککردنی نیشانە فەرمییەکان و بەڕێوەبردنی پڕۆگرامەکانی وەرگرتن.' },
  viewPublic: { ar: 'عرض الدليل العام', en: 'View Public Directory', ku: 'بینینی ڕێبەری گشتی' },
  addInstitution: { ar: 'إضافة مؤسسة', en: 'Add Institution', ku: 'زیادکردنی دامەزراوە' },
  allCategories: { ar: 'كافة الفئات', en: 'All Categories', ku: 'هەموو پۆلەکان' },
  allGovernorates: { ar: 'كافة المحافظات', en: 'All Governorates', ku: 'هەموو پارێزگاکان' },
  results: { ar: 'النتائج:', en: 'Results:', ku: 'ئەنجامەکان:' },
  colInstitution: { ar: 'المؤسسة', en: 'Institution', ku: 'دامەزراوە' },
  colCategoryLocation: { ar: 'الفئة والمحافظة', en: 'Category & Location', ku: 'پۆل و پارێزگا' },
  colRating: { ar: 'التقييم', en: 'Rating', ku: 'هەڵسەنگاندن' },
  colStatus: { ar: 'الحالة', en: 'Status', ku: 'دۆخ' },
  colVerified: { ar: 'التوثيق الرسمي', en: 'Verified Badge', ku: 'پشتڕاستکردنەوەی فەرمی' },
  colFeatured: { ar: 'مميز في الواجهة', en: 'Featured', ku: 'دیارکراو لە ڕووکار' },
  colActions: { ar: 'إجراءات', en: 'Actions', ku: 'کردارەکان' },
  verified: { ar: 'معتمد رسمياً', en: 'Verified', ku: 'بە فەرمی پشتڕاستکراوە' },
  unverified: { ar: 'غير موثق', en: 'Unverified', ku: 'پشتڕاستنەکراوە' },
  featured: { ar: 'مميز', en: 'Featured', ku: 'دیارکراو' },
  standard: { ar: 'عادي', en: 'Standard', ku: 'ئاسایی' },
  edit: { ar: 'تعديل', en: 'Edit', ku: 'دەستکاری' },
  viewProfile: { ar: 'عرض الصفحة العامة', en: 'View Public Profile', ku: 'بینینی پەڕەی گشتی' },
  delete: { ar: 'حذف', en: 'Delete', ku: 'سڕینەوە' },
  confirmDelete: { ar: 'حذف "{name}"؟ سيختفي من الدليل فوراً، ويمكن استعادته من قسم المحذوفات خلال {days} يوماً.', en: `Delete "{name}"? It leaves the directory immediately and can be restored from "Deleted" for {days} days.`, ku: 'دەتەوێت "{name}" بسڕیتەوە؟ یەکسەر لە ڕێبەرەکە دەرەچێت و دەتوانرێت لە بەشی «سڕاوەکان» لە ماوەی {days} ڕۆژدا بگەڕێندرێتەوە.' },
} satisfies CopyDict;
