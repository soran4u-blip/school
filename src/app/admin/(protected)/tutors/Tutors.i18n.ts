import type { CopyDict } from '@/lib/useT';

// Strings for the admin tutors list and the add/edit tutor form. Sorani is a draft pending native
// review (see docs/ku-review-notes.md).
export const TUTORS_COPY = {
  // Shared
  actionFailed: { ar: 'تعذر تنفيذ الإجراء', en: 'The action could not be completed', ku: 'نەتوانرا کردارەکە ئەنجام بدرێت' },
  edit: { ar: 'تعديل', en: 'Edit', ku: 'دەستکاری' },
  delete: { ar: 'حذف', en: 'Delete', ku: 'سڕینەوە' },
  whatsapp: { ar: 'WhatsApp', en: 'WhatsApp', ku: 'واتسئاپ' },

  // Verification queue
  approve: { ar: 'موافقة', en: 'Approve', ku: 'پەسەندکردن' },
  reject: { ar: 'رفض', en: 'Reject', ku: 'ڕەتکردنەوە' },
  viewDocument: { ar: 'عرض الوثيقة', en: 'View document', ku: 'پیشاندانی بەڵگەنامە' },
  rejectionReason: { ar: 'سبب الرفض (اختياري)', en: 'Rejection reason (optional)', ku: 'هۆکاری ڕەتکردنەوە (ئارەزوومەندانە)' },
  pendingRequests: { ar: 'طلبات التوثيق قيد الانتظار', en: 'Pending Verification Requests', ku: 'داواکارییەکانی پشتڕاستکردنەوە لە چاوەڕێدان' },

  // List page
  listTitle: { ar: 'إدارة الأساتذة والمدرسين الخصوصيين', en: 'Private Tutors Directory', ku: 'بەڕێوەبردنی مامۆستا تایبەتەکان' },
  listIntro: { ar: 'اعتماد وتوثيق مدرسي مرحلة السادس الإعدادي (الوزاري) والمراحل الجامعية مع التحقق من الهويات.', en: 'Vet and verify Baccalaureate wazari subject masters and academic tutors.', ku: 'پەسەندکردن و پشتڕاستکردنەوەی مامۆستاکانی پۆلی شەشی ئامادەیی (وەزاری) و قۆناغە زانکۆییەکان لەگەڵ دڵنیابوون لە ناسنامەکان.' },
  addTutor: { ar: 'إضافة أستاذ', en: 'Add Tutor', ku: 'زیادکردنی مامۆستا' },
  confirmDelete: { ar: 'حذف "{name}"؟ سيختفي من الدليل فوراً، ويمكن استعادته من قسم المحذوفات خلال {days} يوماً.', en: 'Delete "{name}"? It leaves the directory immediately and can be restored from "Deleted" for {days} days.', ku: 'دەتەوێت "{name}" بسڕیتەوە؟ یەکسەر لە ڕێبەر نامێنێت و دەتوانرێت لە بەشی سڕاوەکان لە ماوەی {days} ڕۆژدا بگەڕێنرێتەوە.' },
  colTutor: { ar: 'الأستاذ / المعلم', en: 'Tutor', ku: 'مامۆستا' },
  colSubjectGov: { ar: 'التخصص والمحافظة', en: 'Subject & Governorate', ku: 'پسپۆڕی و پارێزگا' },
  colHourlyRate: { ar: 'سعر الساعة', en: 'Hourly Rate', ku: 'نرخی کاتژمێر' },
  colRating: { ar: 'التقييم', en: 'Rating', ku: 'هەڵسەنگاندن' },
  colStatus: { ar: 'النشر', en: 'Status', ku: 'دۆخ' },
  colVerification: { ar: 'حالة التوثيق', en: 'Verification', ku: 'دۆخی پشتڕاستکردنەوە' },
  colActions: { ar: 'إجراءات', en: 'Actions', ku: 'کردارەکان' },
  clickToToggle: { ar: 'اضغط للتبديل', en: 'Click to toggle', ku: 'کلیک بکە بۆ گۆڕین' },

  // Form
  formTitleEdit: { ar: 'تعديل بيانات الأستاذ', en: 'Edit Tutor', ku: 'دەستکاریکردنی زانیارییەکانی مامۆستا' },
  formTitleNew: { ar: 'تسجيل أستاذ خصوصي جديد', en: 'Register New Tutor', ku: 'تۆمارکردنی مامۆستای تایبەتی نوێ' },
  backToList: { ar: 'العودة للقائمة', en: 'Back to list', ku: 'گەڕانەوە بۆ لیست' },
  requiredFields: { ar: 'يرجى ملء الحقول الإلزامية (المعرف، الاسم، المحافظة)', en: 'Please fill required fields (ID, name, governorate)', ku: 'تکایە خانە پێویستەکان پڕبکەرەوە (ناسنامە، ناو، پارێزگا)' },
  saved: { ar: 'تم حفظ بيانات الأستاذ بنجاح', en: 'Tutor saved successfully', ku: 'زانیارییەکانی مامۆستا بە سەرکەوتوویی پاشەکەوت کران' },
  saveFailed: { ar: 'حدث خطأ أثناء الحفظ', en: 'Failed to save tutor', ku: 'هەڵەیەک ڕوویدا لە کاتی پاشەکەوتکردن' },
  tutorId: { ar: 'معرّف الأستاذ (ID)', en: 'Tutor ID', ku: 'ناسنامەی مامۆستا (ID)' },
  photo: { ar: 'الصورة الشخصية', en: 'Photo', ku: 'وێنەی کەسی' },
  nameAr: { ar: 'الاسم الكامل بالعربية', en: 'Full Name (Arabic)', ku: 'ناوی تەواو بە عەرەبی' },
  nameEn: { ar: 'الاسم الكامل بالإنجليزية', en: 'Full Name (English)', ku: 'ناوی تەواو بە ئینگلیزی' },
  titleAr: { ar: 'اللقب المهني بالعربية', en: 'Title (Arabic)', ku: 'نازناوی پیشەیی بە عەرەبی' },
  titleEn: { ar: 'اللقب المهني بالإنجليزية', en: 'Title (English)', ku: 'نازناوی پیشەیی بە ئینگلیزی' },
  bio: { ar: 'نبذة تعريفية', en: 'Bio', ku: 'پێناسەی کورت' },
  governorate: { ar: 'المحافظة', en: 'Governorate', ku: 'پارێزگا' },
  selectGovernorate: { ar: 'اختر المحافظة', en: 'Select governorate', ku: 'پارێزگا هەڵبژێرە' },
  hourlyRateIqd: { ar: 'سعر الساعة (دينار)', en: 'Hourly Rate (IQD)', ku: 'نرخی کاتژمێر (دینار)' },
  yearsExp: { ar: 'سنوات الخبرة', en: 'Years of Experience', ku: 'ساڵانی ئەزموون' },
  groupTotal: { ar: 'إجمالي سعر الجلسة الجماعية (دينار)', en: 'Group Session Total (IQD)', ku: 'کۆی نرخی وانەی گرووپ (دینار)' },
  groupSplit: { ar: 'يُقسّم على عدد الطلاب المنضمين', en: 'Split evenly across students who join', ku: 'بەسەر ژمارەی ئەو قوتابیانەی بەشدار دەبن دابەش دەکرێت' },
  groupMax: { ar: 'الحد الأقصى لحجم المجموعة', en: 'Max Group Size', ku: 'زۆرترین قەبارەی گرووپ' },
  whatsappNumber: { ar: 'رقم واتساب', en: 'WhatsApp Number', ku: 'ژمارەی واتسئاپ' },
  phone: { ar: 'رقم الهاتف', en: 'Phone', ku: 'ژمارەی تەلەفۆن' },
  deliveryMode: { ar: 'طريقة التدريس', en: 'Delivery Mode', ku: 'شێوازی وانەگوتنەوە' },
  subjects: { ar: 'المواد الدراسية', en: 'Subjects', ku: 'بابەتە خوێندنەکان' },
  noSubjects: { ar: 'لا توجد مواد دراسية مضافة بعد. أضفها من صفحة الاعتمادات والمناهج.', en: 'No subjects yet. Add some from Taxonomies.', ku: 'هێشتا هیچ بابەتێک زیاد نەکراوە. لە لاپەڕەی دانپێدانان و مەنهەجەکان زیادی بکە.' },
  levels: { ar: 'الصفوف الدراسية', en: 'Grades / Student Levels', ku: 'پۆلەکانی خوێندن' },
  noLevels: { ar: 'لا توجد صفوف دراسية مضافة بعد. أضفها من صفحة الاعتمادات والمناهج.', en: 'No grades yet. Add some from Taxonomies.', ku: 'هێشتا هیچ پۆلێک زیاد نەکراوە. لە لاپەڕەی دانپێدانان و مەنهەجەکان زیادی بکە.' },
  verificationDocs: { ar: 'وثائق التوثيق المرفوعة', en: 'Uploaded Verification Documents', ku: 'بەڵگەنامە بارکراوەکانی پشتڕاستکردنەوە' },
  document: { ar: 'مستند {n}', en: 'Document {n}', ku: 'بەڵگەنامەی {n}' },
  publishStatus: { ar: 'حالة النشر', en: 'Status', ku: 'دۆخی بڵاوکردنەوە' },
  statusActive: { ar: 'نشط', en: 'Active', ku: 'چالاک' },
  statusPending: { ar: 'قيد المراجعة', en: 'Pending', ku: 'لە چاوەڕێدایە' },
  identityVerified: { ar: 'موثّق الهوية', en: 'Identity Verified', ku: 'ناسنامە پشتڕاستکراوە' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...', ku: 'پاشەکەوت دەکرێت...' },
  saveTutor: { ar: 'حفظ بيانات الأستاذ', en: 'Save Tutor', ku: 'پاشەکەوتکردنی زانیارییەکانی مامۆستا' },
} satisfies CopyDict;
