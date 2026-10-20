import type { CopyDict } from '@/lib/useT';

// Strings for the employer (company / NGO) dashboard: page, profile form, job postings panel and
// the applicants page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
// Applicant names, cover letters and notes are shown as submitted.
export const EMPLOYER_COPY = {
  // Shared
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...', ku: 'پاشەکەوت دەکرێت...' },
  cancel: { ar: 'إلغاء', en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  save: { ar: 'حفظ', en: 'Save', ku: 'پاشەکەوت' },
  edit: { ar: 'تعديل', en: 'Edit', ku: 'دەستکاری' },
  close: { ar: 'إغلاق', en: 'Close', ku: 'داخستن' },
  publish: { ar: 'نشر', en: 'Publish', ku: 'بڵاوکردنەوە' },
  selectGovernorate: { ar: 'اختر المحافظة', en: 'Select governorate', ku: 'پارێزگا هەڵبژێرە' },
  applicantsCount: { ar: '{n} متقدم', en: '{n} applicants', ku: '{n} داواکار' },

  // Page
  loadFailed: { ar: 'تعذر تحميل بيانات لوحة التحكم', en: 'Failed to load dashboard data', ku: 'نەتوانرا داتای داشبۆرد باربکرێت' },
  jobSaved: { ar: 'تم حفظ الوظيفة بنجاح', en: 'Job saved successfully', ku: 'هەلی کار بە سەرکەوتوویی پاشەکەوت کرا' },
  jobSaveFailed: { ar: 'تعذر حفظ الوظيفة', en: 'Failed to save the job', ku: 'نەتوانرا هەلی کار پاشەکەوت بکرێت' },
  changesSaved: { ar: 'تم حفظ التغييرات بنجاح', en: 'Changes saved successfully', ku: 'گۆڕانکارییەکان بە سەرکەوتوویی پاشەکەوت کران' },
  changesSaveFailed: { ar: 'تعذر حفظ التغييرات', en: 'Failed to save changes', ku: 'نەتوانرا گۆڕانکارییەکان پاشەکەوت بکرێن' },
  eventSaved: { ar: 'تم حفظ الفعالية بنجاح', en: 'Event saved successfully', ku: 'ڕووداوەکە بە سەرکەوتوویی پاشەکەوت کرا' },
  eventSaveFailed: { ar: 'تعذر حفظ الفعالية', en: 'Failed to save the event', ku: 'نەتوانرا ڕووداوەکە پاشەکەوت بکرێت' },
  accountNotFound: { ar: 'تعذر العثور على حساب الشركة/المنظمة', en: 'Could not find your employer account', ku: 'نەتوانرا هەژماری کۆمپانیا/ڕێکخراو بدۆزرێتەوە' },
  subtitle: { ar: 'انشر الوظائف والتدريب المهني وأدر المتقدمين', en: 'Post jobs and internships, and manage applicants', ku: 'هەلی کار و ڕاهێنانی پیشەیی بڵاو بکەرەوە و داواکارەکان بەڕێوە ببە' },

  // Profile form
  orgDetails: { ar: 'بيانات الجهة', en: 'Organization Details', ku: 'زانیارییەکانی ڕێکخراو' },
  logo: { ar: 'الشعار', en: 'Logo', ku: 'لۆگۆ' },
  name: { ar: 'الاسم', en: 'Name', ku: 'ناو' },
  orgType: { ar: 'نوع الجهة', en: 'Organization Type', ku: 'جۆری ڕێکخراو' },
  company: { ar: 'شركة', en: 'Company', ku: 'کۆمپانیا' },
  ngo: { ar: 'منظمة غير حكومية', en: 'NGO', ku: 'ڕێکخراوی ناحکومی' },
  description: { ar: 'نبذة تعريفية', en: 'Description', ku: 'پێناسە' },
  governorate: { ar: 'المحافظة', en: 'Governorate', ku: 'پارێزگا' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  phone: { ar: 'رقم الهاتف', en: 'Phone', ku: 'ژمارەی تەلەفۆن' },
  whatsapp: { ar: 'رقم واتساب', en: 'WhatsApp Number', ku: 'ژمارەی واتسئاپ' },
  saveChanges: { ar: 'حفظ التغييرات', en: 'Save Changes', ku: 'پاشەکەوتکردنی گۆڕانکارییەکان' },

  // Job postings panel
  jobPostings: { ar: 'الوظائف الشاغرة', en: 'Job Postings', ku: 'هەلە کارییە بەتاڵەکان' },
  postJob: { ar: 'نشر وظيفة جديدة', en: 'Post a Job', ku: 'بڵاوکردنەوەی هەلێکی کاری نوێ' },
  jobTitleAr: { ar: 'المسمى الوظيفي (عربي)', en: 'Job title (Arabic)', ku: 'ناونیشانی کار (عەرەبی)' },
  jobTitleEn: { ar: 'المسمى الوظيفي (إنجليزي)', en: 'Job title (English)', ku: 'ناونیشانی کار (ئینگلیزی)' },
  jobDescriptionAr: { ar: 'الوصف الوظيفي (عربي)', en: 'Description (Arabic)', ku: 'وەسفی کار (عەرەبی)' },
  jobDescriptionEn: { ar: 'الوصف الوظيفي (إنجليزي)', en: 'Description (English)', ku: 'وەسفی کار (ئینگلیزی)' },
  jobDeadline: { ar: 'آخر موعد لتقديم الطلبات', en: 'Application Deadline', ku: 'دوا کاتی ناردنی داواکارییەکان' },
  remote: { ar: 'عن بُعد', en: 'Remote', ku: 'لە دوورەوە' },
  noJobs: { ar: 'لم تنشر أي وظيفة بعد', en: 'No jobs posted yet', ku: 'هێشتا هیچ هەلێکی کارت بڵاو نەکردووەتەوە' },
  applicantsLink: { ar: 'المتقدمون', en: 'Applicants', ku: 'داواکارەکان' },

  // Applicants page
  loadApplicantsFailed: { ar: 'تعذر تحميل بيانات المتقدمين', en: 'Failed to load applicant data', ku: 'نەتوانرا داتای داواکارەکان باربکرێت' },
  backToDashboard: { ar: 'العودة للوحة التحكم', en: 'Back to dashboard', ku: 'گەڕانەوە بۆ داشبۆرد' },
  jobNotFound: { ar: 'هذه الوظيفة غير موجودة أو لا تملك صلاحية الوصول إليها', en: 'This job was not found or you do not have access to it', ku: 'ئەم هەلی کارە نەدۆزرایەوە یان مافی چوونە ناویت نییە' },
  jobApplicationsCount: { ar: '{n} طلب توظيف', en: '{n} applications', ku: '{n} داواکاری' },
  allStatuses: { ar: 'كافة الحالات', en: 'All Statuses', ku: 'هەموو دۆخەکان' },
  results: { ar: 'النتائج:', en: 'Results:', ku: 'ئەنجامەکان:' },
  sort: { ar: 'الترتيب:', en: 'Sort:', ku: 'ڕیزکردن:' },
  newest: { ar: 'الأحدث', en: 'Newest', ku: 'نوێترین' },
  oldest: { ar: 'الأقدم', en: 'Oldest', ku: 'کۆنترین' },
  applicant: { ar: 'المتقدم', en: 'Applicant', ku: 'داواکار' },
  resume: { ar: 'السيرة الذاتية', en: 'Resume', ku: 'ژیاننامە' },
  status: { ar: 'الحالة', en: 'Status', ku: 'دۆخ' },
  applied: { ar: 'تاريخ التقديم', en: 'Applied', ku: 'بەرواری داواکاری' },
  details: { ar: 'التفاصيل', en: 'Details', ku: 'وردەکاری' },
  noMatch: { ar: 'لا يوجد متقدمون بهذه الحالة', en: 'No applicants match this filter', ku: 'هیچ داواکارێک بەم دۆخە نییە' },
  view: { ar: 'عرض', en: 'View', ku: 'بینین' },
  hide: { ar: 'إخفاء', en: 'Hide', ku: 'شاردنەوە' },
  show: { ar: 'عرض', en: 'Show', ku: 'پیشاندان' },
  coverLetter: { ar: 'الرسالة التعريفية', en: 'Cover Letter', ku: 'نامەی پێشکەشکردن' },
  internalNote: { ar: 'ملاحظة داخلية (خاصة بشركتك فقط)', en: 'Internal Note (visible only to you)', ku: 'تێبینی ناوخۆیی (تەنها بۆ تۆ دیار دەبێت)' },
  internalNotePlaceholder: { ar: 'اكتب ملاحظة عن هذا المتقدم...', en: 'Write a note about this applicant...', ku: 'تێبینییەک دەربارەی ئەم داواکارە بنووسە...' },
} satisfies CopyDict;
