import type { CopyDict } from '@/lib/useT';

// Strings for the institution's applicant pages (admission applicants per program, job applicants
// per posting). Sorani is a draft pending native review (see docs/ku-review-notes.md). Applicant
// names, messages and notes are shown as submitted.
export const APPLICANTS_COPY = {
  // Shared
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...', ku: 'پاشەکەوت دەکرێت...' },
  loadFailed: { ar: 'تعذر تحميل بيانات المتقدمين', en: 'Failed to load applicant data', ku: 'نەتوانرا داتای داواکارەکان باربکرێت' },
  backToDashboard: { ar: 'العودة للوحة التحكم', en: 'Back to dashboard', ku: 'گەڕانەوە بۆ داشبۆرد' },
  allStatuses: { ar: 'كافة الحالات', en: 'All Statuses', ku: 'هەموو دۆخەکان' },
  results: { ar: 'النتائج:', en: 'Results:', ku: 'ئەنجامەکان:' },
  sort: { ar: 'الترتيب:', en: 'Sort:', ku: 'ڕیزکردن:' },
  newest: { ar: 'الأحدث', en: 'Newest', ku: 'نوێترین' },
  oldest: { ar: 'الأقدم', en: 'Oldest', ku: 'کۆنترین' },
  name: { ar: 'الاسم', en: 'Name', ku: 'ناو' },
  applicant: { ar: 'المتقدم', en: 'Applicant', ku: 'داواکار' },
  status: { ar: 'الحالة', en: 'Status', ku: 'دۆخ' },
  applied: { ar: 'تاريخ التقديم', en: 'Applied', ku: 'بەرواری داواکاری' },
  details: { ar: 'التفاصيل', en: 'Details', ku: 'وردەکاری' },
  noMatch: { ar: 'لا يوجد متقدمون بهذه الحالة', en: 'No applicants match this filter', ku: 'هیچ داواکارێک بەم دۆخە نییە' },
  hide: { ar: 'إخفاء', en: 'Hide', ku: 'شاردنەوە' },
  show: { ar: 'عرض', en: 'Show', ku: 'پیشاندان' },

  // Program applicants
  programNotFound: { ar: 'هذا البرنامج غير موجود أو لا تملك صلاحية الوصول إليه', en: 'This program was not found or you do not have access to it', ku: 'ئەم پڕۆگرامە نەدۆزرایەوە یان مافی چوونە ناویت نییە' },
  updateFailed: { ar: 'تعذر تحديث الطلب', en: 'Failed to update application', ku: 'نەتوانرا داواکارییەکە نوێ بکرێتەوە' },
  applicationsCount: { ar: '{n} طلب تقديم', en: '{n} applications', ku: '{n} داواکاری' },
  seatsAccepted: { ar: '{accepted} / {capacity} مقعد مقبول', en: '{accepted} / {capacity} seats accepted', ku: '{accepted} / {capacity} شوێنی وەرگیراو' },
  documents: { ar: 'المستمسكات', en: 'Documents', ku: 'بەڵگەنامەکان' },
  documentN: { ar: 'مستند {n}', en: 'Document {n}', ku: 'بەڵگەنامەی {n}' },
  applicantStatement: { ar: 'رسالة المتقدم', en: 'Applicant Statement', ku: 'نامەی داواکار' },
  decisionNote: { ar: 'ملاحظة القرار (تظهر للطالب)', en: 'Decision Note (visible to the student)', ku: 'تێبینی بڕیار (بۆ قوتابی دیار دەبێت)' },
  decisionNotePlaceholder: { ar: 'اكتب ملاحظة للطالب حول هذا القرار...', en: 'Write a note to the student about this decision...', ku: 'تێبینییەک بۆ قوتابی دەربارەی ئەم بڕیارە بنووسە...' },

  // Job applicants
  jobNotFound: { ar: 'هذه الوظيفة غير موجودة أو لا تملك صلاحية الوصول إليها', en: 'This job was not found or you do not have access to it', ku: 'ئەم هەلی کارە نەدۆزرایەوە یان مافی چوونە ناویت نییە' },
  jobApplicationsCount: { ar: '{n} طلب توظيف', en: '{n} applications', ku: '{n} داواکاری' },
  resume: { ar: 'السيرة الذاتية', en: 'Resume', ku: 'ژیاننامە' },
  view: { ar: 'عرض', en: 'View', ku: 'بینین' },
  coverLetter: { ar: 'الرسالة التعريفية', en: 'Cover Letter', ku: 'نامەی پێشکەشکردن' },
  internalNote: { ar: 'ملاحظة داخلية (خاصة بمؤسستك فقط)', en: 'Internal Note (visible only to your institution)', ku: 'تێبینی ناوخۆیی (تەنها بۆ دامەزراوەکەت دیار دەبێت)' },
  internalNotePlaceholder: { ar: 'اكتب ملاحظة عن هذا المتقدم...', en: 'Write a note about this applicant...', ku: 'تێبینییەک دەربارەی ئەم داواکارە بنووسە...' },
} satisfies CopyDict;
