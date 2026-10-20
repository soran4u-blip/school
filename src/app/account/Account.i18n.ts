import type { CopyDict } from '@/lib/useT';

// Strings for the student account area (layout, dashboard page and its section cards) and the
// signup page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ACCOUNT_COPY = {
  // Layout
  myAccount: { ar: 'حسابي', en: 'My Account', ku: 'هەژمارەکەم' },
  site: { ar: 'الموقع الرئيسي', en: 'Site', ku: 'ماڵپەڕی سەرەکی' },
  logOut: { ar: 'تسجيل الخروج', en: 'Log Out', ku: 'چوونەدەرەوە' },

  // Page: errors and confirms
  loadBookingsFailed: { ar: 'تعذر تحميل الحجوزات', en: 'Failed to load bookings', ku: 'نەتوانرا حیجزەکان باربکرێن' },
  confirmWithdraw: { ar: 'هل أنت متأكد من سحب هذا الطلب؟', en: 'Are you sure you want to withdraw this application?', ku: 'ئایا دڵنیایت لە کشانەوە لەم داواکارییە؟' },
  withdrawFailed: { ar: 'تعذر سحب الطلب', en: 'Failed to withdraw application', ku: 'نەتوانرا داواکارییەکە بکشێنرێتەوە' },
  profileSaved: { ar: 'تم حفظ الملف الشخصي', en: 'Profile saved', ku: 'پرۆفایلەکە پاشەکەوت کرا' },
  profileSaveFailed: { ar: 'تعذر حفظ الملف الشخصي', en: 'Failed to save profile', ku: 'نەتوانرا پرۆفایلەکە پاشەکەوت بکرێت' },
  confirmCancelBooking: { ar: 'هل أنت متأكد من إلغاء هذا الحجز؟', en: 'Are you sure you want to cancel this booking?', ku: 'ئایا دڵنیایت لە هەڵوەشاندنەوەی ئەم حیجزە؟' },
  cancelBookingFailed: { ar: 'تعذر إلغاء الحجز', en: 'Failed to cancel booking', ku: 'نەتوانرا حیجزەکە هەڵبوەشێنرێتەوە' },

  // Page: headings
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  pageTitle: { ar: 'حجوزاتي واستفساراتي', en: 'My Bookings & Inquiries', ku: 'حیجز و پرسیارەکانم' },
  pageIntro: { ar: 'جميع حجوزاتك واستفساراتك ومراسلاتك مع الأساتذة والمؤسسات في مكان واحد.', en: 'All your bookings, inquiries, and conversations with tutors and institutions in one place.', ku: 'هەموو حیجزەکانت و پرسیارەکانت و نامەکانت لەگەڵ مامۆستایان و دامەزراوەکان لە یەک شوێندا.' },
  myBookings: { ar: 'حجوزاتي', en: 'My Bookings', ku: 'حیجزەکانم' },
  admissionTitle: { ar: 'طلبات القبول', en: 'Admission Applications', ku: 'داواکارییەکانی وەرگرتن' },
  admissionIntro: { ar: 'طلبات التقديم على البرامج الأكاديمية وحالتها.', en: 'Your applications to academic programs and their status.', ku: 'داواکارییەکانت بۆ پڕۆگرامە ئەکادیمییەکان و دۆخیان.' },
  jobsTitle: { ar: 'طلبات التوظيف الخاصة بي', en: 'My Job Applications', ku: 'داواکارییەکانی هەلی کارم' },
  jobsIntro: { ar: 'طلبات التوظيف التي قدّمتها وحالتها.', en: 'Job applications you submitted and their status.', ku: 'داواکارییەکانی هەلی کار کە ناردووتن و دۆخیان.' },
  inquiriesTitle: { ar: 'استفساراتي', en: 'My Inquiries', ku: 'پرسیارەکانم' },
  inquiriesIntro: { ar: 'استفساراتك المرسلة إلى المؤسسات التعليمية.', en: 'Inquiries you sent to institutions.', ku: 'ئەو پرسیارانەی بۆ دامەزراوە پەروەردەییەکانت ناردوون.' },

  // Sections
  noAdmissions: { ar: 'لا توجد طلبات قبول بعد.', en: 'No admission applications yet.', ku: 'هێشتا هیچ داواکارییەکی وەرگرتن نییە.' },
  browseInstitutions: { ar: 'تصفّح المؤسسات', en: 'Browse institutions', ku: 'گەڕان لە دامەزراوەکان' },
  withdraw: { ar: 'سحب الطلب', en: 'Withdraw', ku: 'کشانەوەی داواکاری' },
  noBookings: { ar: 'لا توجد حجوزات بعد.', en: 'No bookings yet.', ku: 'هێشتا هیچ حیجزێک نییە.' },
  browseTutors: { ar: 'تصفّح الأساتذة', en: 'Browse tutors', ku: 'گەڕان لە مامۆستایان' },
  groupSession: { ar: 'مجموعة ({size}/{max})', en: 'Group ({size}/{max})', ku: 'گرووپ ({size}/{max})' },
  individual: { ar: 'فردي', en: 'Individual', ku: 'تاکەکەسی' },
  currencyIqd: { ar: 'د.ع.', en: 'IQD', ku: 'دینار' },
  messageTutor: { ar: 'مراسلة الأستاذ', en: 'Message tutor', ku: 'نامە بۆ مامۆستا' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', ku: 'واتسئاپ' },
  cancelBooking: { ar: 'إلغاء الحجز', en: 'Cancel booking', ku: 'هەڵوەشاندنەوەی حیجز' },
  noInquiries: { ar: 'لا توجد استفسارات بعد.', en: 'No inquiries yet.', ku: 'هێشتا هیچ پرسیارێک نییە.' },
  messageInstitution: { ar: 'مراسلة المؤسسة', en: 'Message institution', ku: 'نامە بۆ دامەزراوە' },
  noJobApplications: { ar: 'لا توجد طلبات توظيف بعد.', en: 'No job applications yet.', ku: 'هێشتا هیچ داواکارییەکی هەلی کار نییە.' },
  browseJobs: { ar: 'تصفّح الوظائف', en: 'Browse jobs', ku: 'گەڕان لە هەلەکانی کار' },
  loadingThread: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  noMessages: { ar: 'لا توجد رسائل بعد', en: 'No messages yet', ku: 'هێشتا هیچ نامەیەک نییە' },
  writeMessage: { ar: 'اكتب رسالة...', en: 'Write a message...', ku: 'نامەیەک بنووسە...' },
  send: { ar: 'إرسال', en: 'Send', ku: 'ناردن' },
  savedSearches: { ar: 'عمليات البحث المحفوظة', en: 'Saved Searches', ku: 'گەڕانە پاشەکەوتکراوەکان' },

  // Student profile card
  profileTitle: { ar: 'ملفي الدراسي', en: 'My Student Profile', ku: 'پرۆفایلی خوێندنم' },
  school: { ar: 'المدرسة', en: 'School', ku: 'قوتابخانە' },
  schoolPlaceholder: { ar: 'اسم مدرستك أو جامعتك', en: 'Your school or university', ku: 'ناوی قوتابخانە یان زانکۆکەت' },
  gradeLevel: { ar: 'الصف الدراسي', en: 'Grade / Level', ku: 'پۆلی خوێندن' },
  selectGrade: { ar: 'اختر الصف الدراسي', en: 'Select your grade / level', ku: 'پۆلی خوێندنەکەت هەڵبژێرە' },
  subjectsOfInterest: { ar: 'المواد التي تهمك', en: 'Subjects of Interest', ku: 'ئەو وانانەی گرنگن بۆت' },
  noSubjects: { ar: 'لا توجد مواد دراسية بعد', en: 'No subjects available yet', ku: 'هێشتا هیچ وانەیەک بەردەست نییە' },
  saveProfile: { ar: 'حفظ الملف الشخصي', en: 'Save Profile', ku: 'پاشەکەوتکردنی پرۆفایل' },
} satisfies CopyDict;

export const SIGNUP_COPY = {
  passwordTooShort: { ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', en: 'Password must be at least 6 characters', ku: 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت' },
  emailInUse: { ar: 'هذا البريد الإلكتروني مسجل بالفعل. سجّل الدخول بدلاً من ذلك.', en: 'This email is already registered. Try signing in instead.', ku: 'ئەم ئیمەیڵە پێشتر تۆمارکراوە. لەجیاتی ئەوە بچۆ ژوورەوە.' },
  weakPassword: { ar: 'كلمة المرور ضعيفة جداً', en: 'Password is too weak', ku: 'وشەی نهێنی زۆر لاوازە' },
  createFailed: { ar: 'تعذر إنشاء الحساب. حاول مرة أخرى.', en: 'Could not create your account. Please try again.', ku: 'نەتوانرا هەژمارەکەت دروست بکرێت. تکایە دووبارە هەوڵ بدەرەوە.' },
  title: { ar: 'إنشاء حساب طالب', en: 'Create Student Account', ku: 'دروستکردنی هەژماری قوتابی' },
  intro: { ar: 'أنشئ حساباً لحجز الدروس ومتابعتها ومراسلة أساتذتك.', en: 'Create an account to book sessions, track them, and message your tutors.', ku: 'هەژمارێک دروست بکە بۆ حیجزکردنی وانەکان و بەدواداچوونیان و نامە ناردن بۆ مامۆستاکانت.' },
  fullName: { ar: 'الاسم الكامل', en: 'Full Name', ku: 'ناوی تەواو' },
  phone: { ar: 'رقم الهاتف', en: 'Phone Number', ku: 'ژمارەی تەلەفۆن' },
  phonePlaceholder: { ar: 'نفس الرقم المستخدم عند الحجز', en: 'Same number used when booking', ku: 'هەمان ژمارەی کاتی حیجزکردن' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  password: { ar: 'كلمة المرور', en: 'Password', ku: 'وشەی نهێنی' },
  createAccount: { ar: 'إنشاء الحساب', en: 'Create Account', ku: 'دروستکردنی هەژمار' },
  haveAccount: { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?', ku: 'پێشتر هەژمارت هەیە؟' },
  signIn: { ar: 'تسجيل الدخول', en: 'Sign in', ku: 'چوونەژوورەوە' },
} satisfies CopyDict;
