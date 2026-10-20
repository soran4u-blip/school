import type { CopyDict } from '@/lib/useT';

// Strings for the join-applications queue. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const APPLICATIONS_COPY = {
  loadFailed: { ar: 'تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', en: 'Failed to load data. Make sure you are signed in as superadmin.', ku: 'نەتوانرا داتا باربکرێت. دڵنیابە وەک سوپەر ئەدمین چوویتە ژوورەوە.' },
  approveFailed: { ar: 'تعذرت الموافقة على الطلب', en: 'Failed to approve application', ku: 'نەتوانرا داواکارییەکە پەسەند بکرێت' },
  rejectReasonPrompt: { ar: 'سبب الرفض (اختياري)', en: 'Rejection reason (optional)', ku: 'هۆکاری ڕەتکردنەوە (ئارەزوومەندانە)' },
  title: { ar: 'طلبات الانضمام', en: 'Join Applications', ku: 'داواکارییەکانی پەیوەستبوون' },
  subtitle: { ar: 'راجع طلبات الانضمام من الأساتذة والمؤسسات. الموافقة على أستاذ تنشئ له حساب دخول تلقائياً.', en: 'Review applications from prospective tutors and institutions. Approving a tutor automatically provisions their login.', ku: 'داواکارییەکانی پەیوەستبوونی مامۆستایان و دامەزراوەکان پێداچوونەوە بکە. پەسەندکردنی مامۆستا خۆکارانە هەژماری چوونەژوورەوەی بۆ دروست دەکات.' },
  copy: { ar: 'نسخ', en: 'Copy', ku: 'لەبەرگرتنەوە' },
  dismiss: { ar: 'إغلاق', en: 'Dismiss', ku: 'داخستن' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  empty: { ar: 'لا توجد طلبات بعد', en: 'No applications yet', ku: 'هێشتا هیچ داواکارییەک نییە' },
  typeTutor: { ar: 'أستاذ', en: 'Tutor', ku: 'مامۆستا' },
  typeInstitution: { ar: 'مؤسسة', en: 'Institution', ku: 'دامەزراوە' },
  typeEmployer: { ar: 'شركة/منظمة', en: 'Company/NGO', ku: 'کۆمپانیا/ڕێکخراو' },
  approvingStuck: { ar: 'قيد المعالجة - أعد المحاولة', en: 'Stuck mid-approval — retry', ku: 'لە پرۆسەی پەسەندکردندا گیراوە — دووبارە هەوڵ بدەرەوە' },
  reason: { ar: 'سبب الرفض: ', en: 'Reason: ', ku: 'هۆکار:' },
  retry: { ar: 'إعادة المحاولة', en: 'Retry', ku: 'دووبارە هەوڵدانەوە' },
  approve: { ar: 'قبول', en: 'Approve', ku: 'پەسەندکردن' },
  reject: { ar: 'رفض', en: 'Reject', ku: 'ڕەتکردنەوە' },
  loadMore: { ar: 'تحميل المزيد', en: 'Load more', ku: 'زیاتر بار بکە' },
  accountCreated: { ar: 'تم إنشاء الحساب لـ {email}. شارك رابط تعيين كلمة المرور معه:', en: 'Account created for {email}. Share this password-setup link with them:', ku: 'هەژمار بۆ {email} دروستکرا. بەستەری دانانی وشەی نهێنی لەگەڵیدا هاوبەش بکە:' },
  yearsExperience: { ar: '{n} سنوات خبرة', en: '{n} yrs experience', ku: '{n} ساڵ ئەزموون' },
} satisfies CopyDict;
