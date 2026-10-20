import type { CopyDict } from '@/lib/useT';

// Strings for the public "join Eduraq" application form and its status lookup page. Sorani is a
// draft pending native review (see docs/ku-review-notes.md).
export const APPLY_COPY = {
  // Errors
  fillRequired: { ar: 'يرجى ملء جميع الحقول الإلزامية', en: 'Please fill in all required fields', ku: 'تکایە هەموو خانە پێویستەکان پڕ بکەرەوە' },
  selectCategory: { ar: 'يرجى اختيار نوع المؤسسة', en: 'Please select an institution category', ku: 'تکایە جۆری دامەزراوەکە هەڵبژێرە' },
  submitFailed: { ar: 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى.', en: 'Something went wrong submitting your application. Please try again.', ku: 'هەڵەیەک ڕوویدا لە کاتی ناردنی داواکارییەکەدا. تکایە دووبارە هەوڵ بدەرەوە.' },

  // Success screen
  submittedTitle: { ar: 'تم إرسال طلبك بنجاح', en: 'Application Submitted', ku: 'داواکارییەکەت بە سەرکەوتوویی نێردرا' },
  submittedBody: { ar: 'سيراجع فريقنا طلبك وسنتواصل معك عبر البريد الإلكتروني أو الواتساب بمجرد الموافقة.', en: "Our team will review your application and reach out by email or WhatsApp once it's approved.", ku: 'تیمەکەمان داواکارییەکەت پێداچوونەوەی بۆ دەکات و کاتێک پەسەند کرا لە ڕێگەی ئیمەیڵ یان واتسئاپەوە پەیوەندیت پێوە دەکەین.' },
  referenceNumber: { ar: 'رقم المرجع', en: 'Reference number', ku: 'ژمارەی سەرچاوە' },
  // {link} is replaced by a link to the status page (the text is split around it when rendered).
  statusHint: { ar: 'يمكنك متابعة حالة طلبك في أي وقت من صفحة {link} باستخدام بريدك الإلكتروني.', en: 'You can check your application status anytime on the {link} using your email address.', ku: 'دەتوانیت لە هەر کاتێکدا بە ئیمەیڵەکەت دۆخی داواکارییەکەت لە {link} بەدوادا بچیت.' },
  statusPage: { ar: 'صفحة حالة الطلب', en: 'application status page', ku: 'پەڕەی دۆخی داواکاری' },
  backHome: { ar: 'العودة للموقع الرئيسي', en: 'Back to Home', ku: 'گەڕانەوە بۆ ماڵپەڕی سەرەکی' },

  // Form
  joinTitle: { ar: 'انضم إلى Eduraq', en: 'Join Eduraq', ku: 'بەشداربە لە Eduraq' },
  joinIntro: { ar: 'قدّم طلبك كأستاذ خصوصي، مؤسسة تعليمية، أو شركة/منظمة لنشر فرص العمل — سيراجعه فريقنا قبل التفعيل.', en: 'Apply as a private tutor, an educational institution, or a company/NGO to post job openings — our team reviews every application before activation.', ku: 'وەک مامۆستای تایبەت، دامەزراوەی پەروەردەیی، یان کۆمپانیا/ڕێکخراو داواکاری بنێرە بۆ بڵاوکردنەوەی هەلی کار — تیمەکەمان پێش چالاککردن هەموو داواکارییەک پێداچوونەوەی بۆ دەکات.' },
  typeTutor: { ar: 'أستاذ خصوصي', en: 'Private Tutor', ku: 'مامۆستای تایبەت' },
  typeInstitution: { ar: 'مؤسسة تعليمية', en: 'Institution', ku: 'دامەزراوەی پەروەردەیی' },
  typeEmployer: { ar: 'شركة / منظمة', en: 'Company / NGO', ku: 'کۆمپانیا / ڕێکخراو' },
  typeStudent: { ar: 'طالب / ولي أمر', en: 'Student / Parent', ku: 'قوتابی / سەرپەرشتیار' },
  institutionName: { ar: 'اسم المؤسسة', en: 'Institution Name', ku: 'ناوی دامەزراوە' },
  companyName: { ar: 'اسم الشركة أو المنظمة', en: 'Company / Organization Name', ku: 'ناوی کۆمپانیا یان ڕێکخراو' },
  fullName: { ar: 'الاسم الكامل', en: 'Full Name', ku: 'ناوی تەواو' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  phone: { ar: 'رقم الهاتف', en: 'Phone', ku: 'ژمارەی تەلەفۆن' },
  whatsapp: { ar: 'رقم الواتساب', en: 'WhatsApp Number', ku: 'ژمارەی واتسئاپ' },
  optional: { ar: 'اختياري', en: 'Optional', ku: 'ئارەزوومەندانە' },
  governorate: { ar: 'المحافظة', en: 'Governorate', ku: 'پارێزگا' },
  selectGovernorate: { ar: 'اختر المحافظة', en: 'Select governorate', ku: 'پارێزگا هەڵبژێرە' },
  yearsExperience: { ar: 'سنوات الخبرة', en: 'Years of Experience', ku: 'ساڵانی ئەزموون' },
  subjectsTeach: { ar: 'المواد التي تدرّسها', en: 'Subjects You Teach', ku: 'ئەو وانانەی دەیانڵێیتەوە' },
  gradesTeach: { ar: 'الصفوف التي تدرّسها', en: 'Grades You Teach', ku: 'ئەو پۆلانەی دەیانڵێیتەوە' },
  employerType: { ar: 'النوع', en: 'Type', ku: 'جۆر' },
  company: { ar: 'شركة', en: 'Company', ku: 'کۆمپانیا' },
  ngo: { ar: 'منظمة غير حكومية', en: 'NGO', ku: 'ڕێکخراوی نافەرمی' },
  institutionCategory: { ar: 'نوع المؤسسة *', en: 'Institution Category *', ku: 'جۆری دامەزراوە *' },
  selectCategoryOption: { ar: 'اختر النوع', en: 'Select category', ku: 'جۆر هەڵبژێرە' },
  aboutInstitution: { ar: 'نبذة عن المؤسسة', en: 'Tell us about your institution', ku: 'کەمێک دەربارەی دامەزراوەکەت پێمان بڵێ' },
  aboutCompany: { ar: 'نبذة عن الشركة أو المنظمة', en: 'Tell us about your company or organization', ku: 'کەمێک دەربارەی کۆمپانیا یان ڕێکخراوەکەت پێمان بڵێ' },
  aboutYou: { ar: 'نبذة عنك ومؤهلاتك', en: 'Tell us about yourself and your qualifications', ku: 'کەمێک دەربارەی خۆت و بڕوانامەکانت پێمان بڵێ' },
  submit: { ar: 'إرسال الطلب', en: 'Submit Application', ku: 'ناردنی داواکاری' },

  // Status page
  lookupFailed: { ar: 'تعذر البحث', en: 'Failed to look up your application', ku: 'نەتوانرا داواکارییەکەت بدۆزرێتەوە' },
  statusTitle: { ar: 'حالة طلبي', en: 'My Application Status', ku: 'دۆخی داواکارییەکەم' },
  statusIntro: { ar: 'أدخل البريد الإلكتروني الذي استخدمته عند التقديم لعرض حالة طلبك.', en: 'Enter the email you applied with to see your application status.', ku: 'ئەو ئیمەیڵە بنووسە کە لە کاتی داواکاریدا بەکارت هێناوە بۆ بینینی دۆخی داواکارییەکەت.' },
  emailAddress: { ar: 'البريد الإلكتروني', en: 'Email address', ku: 'ناونیشانی ئیمەیڵ' },
  search: { ar: 'بحث', en: 'Search', ku: 'گەڕان' },
  noApplications: { ar: 'لا توجد طلبات بهذا البريد الإلكتروني', en: 'No applications found for this email', ku: 'هیچ داواکارییەک بەم ئیمەیڵە نەدۆزرایەوە' },
  reference: { ar: 'رقم المرجع', en: 'Reference', ku: 'ژمارەی سەرچاوە' },
  statusPending: { ar: 'قيد المراجعة', en: 'Pending Review', ku: 'لە ژێر پێداچوونەوەدایە' },
  statusApproved: { ar: 'تمت الموافقة', en: 'Approved', ku: 'پەسەندکرا' },
  statusRejected: { ar: 'مرفوض', en: 'Rejected', ku: 'ڕەتکرایەوە' },
} satisfies CopyDict;
