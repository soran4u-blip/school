import type { CopyDict } from '@/lib/useT';
import type { AdmissionApplicationStatus } from '@/core/types/admission';

// Strings for the public institution profile, its tabs and its two dialogs. Sorani is a draft
// pending native review (see docs/ku-review-notes.md).
export const INSTITUTION_COPY = {
  // Header and stats ribbon
  home: { ar: 'الرئيسية', en: 'Home', ku: 'سەرەکی' },
  directory: { ar: 'الدليل التعليمي', en: 'Directory', ku: 'ڕێبەری پەروەردەیی' },
  verificationPending: { ar: 'قيد التحقق', en: 'Verification pending', ku: 'لە چاوەڕێی پشتڕاستکردنەوەدایە' },
  reviewsCount: { ar: '{n} تقييم', en: '{n} reviews', ku: '{n} هەڵسەنگاندن' },
  established: { ar: 'سنة التأسيس', en: 'Established', ku: 'ساڵی دامەزراندن' },
  notProvided: { ar: 'غير محدد', en: 'Not provided', ku: 'دیارینەکراوە' },
  genderPolicy: { ar: 'نظام الطلاب', en: 'Gender Policy', ku: 'سیستەمی قوتابیان' },
  coEd: { ar: 'مختلط (ذكور وإناث)', en: 'Co-Educational', ku: 'تێکەڵ (کوڕ و کچ)' },
  singleGender: { ar: 'أحادي', en: 'Single Gender', ku: 'یەک ڕەگەز' },
  tuitionTier: { ar: 'متوسط القسط السنوي', en: 'Tuition Tier', ku: 'تێکڕای کرێی ساڵانە' },
  fullyFree: { ar: 'مجاني بالكامل', en: '100% Free', ku: 'بە تەواوی بێبەرامبەر' },
  graduateRate: { ar: 'نسبة توظيف الخريجين', en: 'Graduate Rate', ku: 'ڕێژەی دامەزراندنی دەرچووان' },

  // Tab bar
  sections: { ar: 'أقسام الملف', en: 'Profile sections', ku: 'بەشەکانی پرۆفایل' },
  tabOverview: { ar: 'نظرة عامة والاعتماد', en: 'Overview & Accreditation', ku: 'پوختە و دانپێدانان' },
  tabPrograms: { ar: 'الكليات والبرامج والأقساط', en: 'Programs & Tuition', ku: 'کۆلێژ، پڕۆگرام و کرێی خوێندن' },
  tabFacilities: { ar: 'المرافق والخدمات', en: 'Campus Facilities', ku: 'ئامرازەکان و خزمەتگوزارییەکان' },
  tabAdmissions: { ar: 'شروط القبول ومعدلات الوزاري', en: 'Admission Requirements', ku: 'مەرجەکانی وەرگرتن و ڕێژەی وەزاری' },
  tabReviews: { ar: 'التقييمات والآراء', en: 'Reviews', ku: 'هەڵسەنگاندن و بۆچوونەکان' },

  // Overview tab
  about: { ar: 'عن المؤسسة ورؤيتها التعليمية', en: 'About the Institution', ku: 'دەربارەی دامەزراوەکە و تێڕوانینە پەروەردەییەکەی' },
  accreditationStatus: { ar: 'حالة الاعتماد والترخيص', en: 'Accreditation & licensing', ku: 'دۆخی دانپێدانان و مۆڵەت' },
  accreditationUnverified: { ar: 'بيانات الاعتماد غير متاحة للتحقق', en: 'Accreditation details not verified', ku: 'زانیاری دانپێدانان بۆ پشتڕاستکردنەوە بەردەست نییە' },
  accreditationNone: { ar: 'لم تتم إضافة تفاصيل اعتماد خاصة بهذه المؤسسة بعد. تواصل مع قسم القبول للتحقق من المتطلبات الرسمية.', en: 'Institution-specific accreditation details have not been supplied yet. Contact admissions to confirm official requirements.', ku: 'هێشتا زانیاری دانپێدانانی تایبەت بەم دامەزراوەیە زیاد نەکراوە. پەیوەندی بە بەشی وەرگرتنەوە بکە بۆ دڵنیابوون لە مەرجە فەرمییەکان.' },
  lastVerified: { ar: 'آخر تحقق:', en: 'Last verified:', ku: 'دوایین پشتڕاستکردنەوە:' },
  languagesOfInstruction: { ar: 'لغات التدريس', en: 'Languages of instruction', ku: 'زمانەکانی وانەگوتنەوە' },
  notSpecified: { ar: 'غير محددة', en: 'Not specified', ku: 'دیارینەکراوە' },
  profileUpdated: { ar: 'آخر تحديث للملف', en: 'Profile updated', ku: 'دوایین نوێکردنەوەی پرۆفایل' },
  gallery: { ar: 'صور من الحرم والمرافق', en: 'Campus & facilities', ku: 'وێنە لە کامپس و ئامرازەکان' },
  langAR: { ar: 'العربية', en: 'العربية', ku: 'عەرەبی' },
  langEN: { ar: 'English', en: 'English', ku: 'ئینگلیزی' },
  langKU: { ar: 'Kurdish', en: 'Kurdish', ku: 'کوردی' },
  langFR: { ar: 'Français', en: 'Français', ku: 'فەڕەنسی' },

  // Facilities and admissions tabs
  facilitiesTitle: { ar: 'المرافق والخدمات الجامعية والمدرسية', en: 'Campus Facilities', ku: 'ئامرازەکان و خزمەتگوزارییە زانکۆیی و قوتابخانەییەکان' },
  admissionsTitle: { ar: 'شروط القبول ومستمسكات التقديم', en: 'Admissions & Requirements', ku: 'مەرجەکانی وەرگرتن و بەڵگەنامەکانی داواکاری' },
  requiredDocuments: { ar: 'المستمسكات المطلوبة:', en: 'Required Documents:', ku: 'بەڵگەنامە پێویستەکان:' },
  noDocuments: { ar: 'لم تنشر المؤسسة قائمة المستمسكات المطلوبة بعد. تواصل مع قسم القبول للتأكد من المتطلبات الرسمية.', en: 'This institution has not published its required documents yet. Contact admissions to confirm the official requirements.', ku: 'دامەزراوەکە هێشتا لیستی بەڵگەنامە پێویستەکانی بڵاو نەکردووەتەوە. پەیوەندی بە بەشی وەرگرتنەوە بکە بۆ دڵنیابوون لە مەرجە فەرمییەکان.' },
  askAdmissions: { ar: 'اسأل قسم القبول عن المتطلبات', en: 'Ask admissions about requirements', ku: 'لە بەشی وەرگرتن بپرسە دەربارەی مەرجەکان' },

  // Contact card
  office: { ar: 'شعبة شؤون الطلبة والتسجيل', en: 'Student Admissions Office', ku: 'بەشی کاروباری قوتابیان و تۆمارکردن' },
  directInquiry: { ar: 'تواصل مباشر مع قسم القبول', en: 'Direct Admissions Inquiry', ku: 'پەیوەندی ڕاستەوخۆ لەگەڵ بەشی وەرگرتن' },
  directBody: { ar: 'استفسر عن المقاعد المتبقية، الأقساط، والمنح عبر واتساب فوراً.', en: 'Chat directly with admissions officers on WhatsApp.', ku: 'دەربارەی شوێنە ماوەکان، کرێی خوێندن و بورسەکان لە ڕێگەی واتسئاپەوە دەستبەجێ بپرسە.' },
  chatNow: { ar: 'مراسلة فورية', en: 'Chat Now', ku: 'گفتوگۆی ڕاستەوخۆ' },
  whatsappOfficial: { ar: 'مراسلة عبر واتساب الرسمي', en: 'Chat on Official WhatsApp', ku: 'نامە بنێرە لە ڕێگەی واتسئاپی فەرمییەوە' },
  requestInfo: { ar: 'طلب معلومات إضافية', en: 'Request More Info', ku: 'داواکردنی زانیاری زیاتر' },
  website: { ar: 'الموقع الإلكتروني الرسمي', en: 'Official Website', ku: 'ماڵپەڕی فەرمی' },
  chatContextTitle: { ar: 'القبول — {name}', en: 'Admissions — {name}', ku: 'وەرگرتن — {name}' },
  whatsappMessage: { ar: 'مرحباً، أود الاستفسار عن القبول والتسجيل في {name}', en: "Hi, I'd like to ask about admissions at {name}", ku: 'سڵاو، دەمەوێت دەربارەی وەرگرتن و تۆمارکردن لە {name} بپرسم' },

  // Submit handlers (messages shown in the dialogs)
  fileTypeError: { ar: 'يرجى اختيار ملف PDF أو صورة', en: 'Please select a PDF or image file', ku: 'تکایە فایلی PDF یان وێنە هەڵبژێرە' },
  fileSizeError: { ar: 'الحد الأقصى لحجم الملف 5 ميغابايت', en: 'Max file size is 5MB', ku: 'زۆرترین قەبارەی فایل 5 مێگابایتە' },
  uploadFailed: { ar: 'تعذر رفع الملف', en: 'Failed to upload the file', ku: 'نەتوانرا فایلەکە باربکرێت' },
  applyFailed: { ar: 'تعذر إرسال طلبك', en: 'Failed to submit your application', ku: 'نەتوانرا داواکارییەکەت بنێردرێت' },
  applySuccess: { ar: 'تم إرسال طلبك بنجاح! يمكنك متابعة حالته من حسابك.', en: 'Your application was submitted! You can track its status from your account.', ku: 'داواکارییەکەت بە سەرکەوتوویی نێردرا! دەتوانیت دۆخەکەی لە هەژمارەکەتەوە بەدواداچوون بکەیت.' },
  reviewNameComment: { ar: 'يرجى إدخال الاسم والتعليق', en: 'Please enter your name and comment', ku: 'تکایە ناو و کۆمێنتەکەت بنووسە' },
  reviewWait: { ar: 'يرجى الانتظار قليلاً قبل إرسال تقييم آخر', en: 'Please wait a moment before submitting another review', ku: 'تکایە کەمێک چاوەڕێ بکە پێش ناردنی هەڵسەنگاندنێکی تر' },
  reviewFailed: { ar: 'تعذر إرسال التقييم، حاول مرة أخرى', en: 'Failed to submit review, please try again', ku: 'نەتوانرا هەڵسەنگاندنەکە بنێردرێت، دووبارە هەوڵ بدەرەوە' },
  inquiryWait: { ar: 'يرجى الانتظار قليلاً قبل إرسال طلب آخر', en: 'Please wait a moment before submitting another request', ku: 'تکایە کەمێک چاوەڕێ بکە پێش ناردنی داواکارییەکی تر' },
  inquiryFailed: { ar: 'تعذر إرسال الطلب، حاول مرة أخرى', en: 'Could not send your request. Please try again.', ku: 'نەتوانرا داواکارییەکە بنێردرێت. تکایە دووبارە هەوڵ بدەرەوە.' },

  // Apply dialog
  applyTo: { ar: 'التقديم على', en: 'Apply to', ku: 'داواکاری بۆ' },
  viewMyApplications: { ar: 'عرض طلباتي', en: 'View my applications', ku: 'بینینی داواکارییەکانم' },
  statement: { ar: 'رسالة تعريفية (اختياري)', en: 'Personal statement (optional)', ku: 'نامەی ناساندن (ئارەزوومەندانە)' },
  uploading: { ar: 'جاري الرفع...', en: 'Uploading...', ku: 'باردەکرێت...' },
  attach: { ar: 'إرفاق مستند (اختياري)', en: 'Attach a document (optional)', ku: 'هاوپێچکردنی بەڵگەنامە (ئارەزوومەندانە)' },
  submitting: { ar: 'جاري الإرسال...', en: 'Submitting...', ku: 'دەنێردرێت...' },
  submitApplication: { ar: 'إرسال الطلب', en: 'Submit Application', ku: 'ناردنی داواکاری' },

  // Inquiry dialog
  close: { ar: 'إغلاق', en: 'Close', ku: 'داخستن' },
  inquiryIntro: { ar: 'سيتواصل معك قسم القبول في {name} في أقرب وقت.', en: 'The admissions office at {name} will get back to you shortly.', ku: 'بەشی وەرگرتنی {name} بەم زووانە پەیوەندیت پێوە دەکات.' },
  inquirySent: { ar: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.', en: 'Your request was sent successfully! We will contact you soon.', ku: 'داواکارییەکەت بە سەرکەوتوویی نێردرا! بەم زووانە پەیوەندیت پێوە دەکەین.' },
  backToProfile: { ar: 'العودة إلى الملف', en: 'Back to profile', ku: 'گەڕانەوە بۆ پرۆفایل' },
  fullName: { ar: 'الاسم الكامل', en: 'Full name', ku: 'ناوی تەواو' },
  phone: { ar: 'رقم الهاتف', en: 'Phone number', ku: 'ژمارەی تەلەفۆن' },
  emailLabel: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  emailOptional: { ar: 'البريد الإلكتروني (اختياري)', en: 'Email (optional)', ku: 'ئیمەیڵ (ئارەزوومەندانە)' },
  yourMessage: { ar: 'رسالتك', en: 'Your message', ku: 'نامەکەت' },
  messageOptional: { ar: 'رسالتك (اختياري)', en: 'Your message (optional)', ku: 'نامەکەت (ئارەزوومەندانە)' },
  sending: { ar: 'جاري الإرسال...', en: 'Sending...', ku: 'دەنێردرێت...' },
  sendRequest: { ar: 'إرسال الطلب', en: 'Send Request', ku: 'ناردنی داواکاری' },

  // Programs tab
  programsHeading: { ar: 'البرامج الأكاديمية والأقساط السنوية للعام الحالي', en: 'Academic Programs & Annual Tuition', ku: 'پڕۆگرامە ئەکادیمییەکان و کرێی ساڵانەی ساڵی ئێستا' },
  programsCount: { ar: '{n} برنامج متاح', en: '{n} programs', ku: '{n} پڕۆگرامی بەردەست' },
  programYears: { ar: '{n} سنوات دراسية', en: '{n} years', ku: '{n} ساڵی خوێندن' },
  minBaccalaureate: { ar: 'الحد الأدنى لمعدل السادس الإعدادي: {n}%', en: 'Min Baccalaureate: {n}%', ku: 'کەمترین ڕێژەی پۆلی شەشی ئامادەیی: {n}%' },
  applicationsClose: { ar: 'آخر موعد للتقديم: {date}', en: 'Applications close: {date}', ku: 'دوایین کاتی داواکاری: {date}' },
  seatsLeft: { ar: '{n} مقعد متبقٍ', en: '{n} seats left', ku: '{n} شوێنی ماوە' },
  seatLeft: { ar: '{n} مقعد متبقٍ', en: '{n} seat left', ku: '{n} شوێنی ماوە' },
  perYearLong: { ar: 'سنوياً', en: 'year', ku: 'ساڵانە' },
  applyNow: { ar: 'التقديم الآن', en: 'Apply Now', ku: 'ئێستا داواکاری بکە' },
  applicationsClosed: { ar: 'التقديم مغلق حالياً', en: 'Applications closed', ku: 'داواکاری ئێستا داخراوە' },
  noPrograms: { ar: 'لم يتم إدراج برامج تفصيلية حتى الآن. تواصل مع قسم التسجيل لمزيد من التفاصيل.', en: 'No specific programs listed.', ku: 'هێشتا پڕۆگرامی وردەکاری تۆمار نەکراوە. بۆ زانیاری زیاتر پەیوەندی بە بەشی تۆمارکردنەوە بکە.' },

  // Reviews tab
  reviewsHeading: { ar: 'تقييمات وآراء الطلبة وأولياء الأمور', en: 'Student & Parent Reviews', ku: 'هەڵسەنگاندن و بۆچوونی قوتابیان و دایک و باوکان' },
  approvedCount: { ar: '{n} تقييم معتمد', en: '{n} approved reviews', ku: '{n} هەڵسەنگاندنی پەسەندکراو' },
  verifiedStudentHint: { ar: 'طالب مقبول فعلياً في هذه المؤسسة', en: 'This student was actually accepted at this institution', ku: 'ئەم قوتابییە بەڕاستی لەم دامەزراوەیەدا وەرگیراوە' },
  verifiedStudent: { ar: 'طالب موثّق', en: 'Verified Student', ku: 'قوتابی پشتڕاستکراو' },
  reply: { ar: 'رد {name}', en: "{name}'s reply", ku: 'وەڵامی {name}' },
  noApprovedReviews: { ar: 'لا توجد تقييمات معتمدة بعد. كن أول من يشارك رأيه.', en: 'No approved reviews yet. Be the first to share your experience.', ku: 'هێشتا هیچ هەڵسەنگاندنێکی پەسەندکراو نییە. یەکەم کەس بە کە بۆچوونەکەی هاوبەش دەکات.' },
  writeReview: { ar: 'شارك تقييمك', en: 'Write a Review', ku: 'هەڵسەنگاندنەکەت هاوبەش بکە' },
  reviewThanks: { ar: 'شكراً لك! تم إرسال تقييمك وسيظهر بعد مراجعته من الإدارة.', en: 'Thank you! Your review was submitted and will appear after moderation.', ku: 'سوپاس! هەڵسەنگاندنەکەت نێردرا و دوای پێداچوونەوەی بەڕێوەبەرایەتی دەردەکەوێت.' },
  yourName: { ar: 'اسمك', en: 'Your name', ku: 'ناوت' },
  commentPlaceholder: { ar: 'اكتب تعليقك هنا...', en: 'Write your comment here...', ku: 'کۆمێنتەکەت لێرە بنووسە...' },
  submitReview: { ar: 'إرسال التقييم', en: 'Submit Review', ku: 'ناردنی هەڵسەنگاندن' },
} satisfies CopyDict;

export const ADMISSION_STATUS_COPY = {
  SUBMITTED: { ar: 'تم الإرسال', en: 'Submitted', ku: 'نێردرا' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review', ku: 'لە ژێر پێداچوونەوەدایە' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted', ku: 'لە لیستی چاوەڕوانیدایە' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted', ku: 'وەرگیرا' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected', ku: 'ڕەتکرایەوە' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn', ku: 'کشایەوە' },
} satisfies CopyDict<AdmissionApplicationStatus>;
