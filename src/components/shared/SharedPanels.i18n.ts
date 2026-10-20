import type { CopyDict } from '@/lib/useT';

// Strings for the dashboard panels shared by the institution, tutor and employer dashboards.
// Sorani is a draft pending native review (see docs/ku-review-notes.md).

export const EVENTS_MANAGER_COPY = {
  events: { ar: 'الفعاليات', en: 'Events', ku: 'ڕووداوەکان' },
  postEvent: { ar: 'نشر فعالية جديدة', en: 'Post an Event', ku: 'بڵاوکردنەوەی ڕووداوێکی نوێ' },
  titleAr: { ar: 'عنوان الفعالية (عربي)', en: 'Event title (Arabic)', ku: 'ناونیشانی ڕووداو (عەرەبی)' },
  titleEn: { ar: 'عنوان الفعالية (إنجليزي)', en: 'Event title (English)', ku: 'ناونیشانی ڕووداو (ئینگلیزی)' },
  descAr: { ar: 'وصف الفعالية (عربي)', en: 'Description (Arabic)', ku: 'وەسفی ڕووداو (عەرەبی)' },
  descEn: { ar: 'وصف الفعالية (إنجليزي)', en: 'Description (English)', ku: 'وەسفی ڕووداو (ئینگلیزی)' },
  selectGovernorate: { ar: 'اختر المحافظة', en: 'Select governorate', ku: 'پارێزگا هەڵبژێرە' },
  startDate: { ar: 'تاريخ البدء', en: 'Start date', ku: 'بەرواری دەستپێکردن' },
  endDate: { ar: 'تاريخ الانتهاء (اختياري)', en: 'End date (optional)', ku: 'بەرواری کۆتایی (ئارەزوومەندانە)' },
  registrationLink: { ar: 'رابط التسجيل (اختياري)', en: 'Registration link (optional)', ku: 'بەستەری تۆمارکردن (ئارەزوومەندانە)' },
  whatsapp: { ar: 'رقم واتساب (اختياري)', en: 'WhatsApp number (optional)', ku: 'ژمارەی واتسئاپ (ئارەزوومەندانە)' },
  venue: { ar: 'اسم القاعة/الموقع (اختياري)', en: 'Venue name (optional)', ku: 'ناوی هۆڵ/شوێن (ئارەزوومەندانە)' },
  online: { ar: 'فعالية عبر الإنترنت', en: 'Online event', ku: 'ڕووداوی ئۆنلاین' },
  cancel: { ar: 'إلغاء', en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  saving: { ar: 'جاري الحفظ...', en: 'Saving...', ku: 'پاشەکەوت دەکرێت...' },
  save: { ar: 'حفظ', en: 'Save', ku: 'پاشەکەوت' },
  noEvents: { ar: 'لم تنشر أي فعالية بعد', en: 'No events posted yet', ku: 'هێشتا هیچ ڕووداوێکت بڵاو نەکردووەتەوە' },
  edit: { ar: 'تعديل', en: 'Edit', ku: 'دەستکاری' },
  close: { ar: 'إغلاق', en: 'Close', ku: 'داخستن' },
  publish: { ar: 'نشر', en: 'Publish', ku: 'بڵاوکردنەوە' },
} satisfies CopyDict;

export const NOTIFICATION_CENTER_COPY = {
  notifications: { ar: 'الإشعارات', en: 'Notifications', ku: 'ئاگادارکردنەوەکان' },
  newCount: { ar: 'جديدة', en: 'new', ku: 'نوێ' },
  markAllRead: { ar: 'تحديد الكل كمقروء', en: 'Mark all read', ku: 'هەمووی وەک خوێندراوە دیاری بکە' },
  all: { ar: 'الكل', en: 'All', ku: 'هەموو' },
  unread: { ar: 'غير المقروءة', en: 'Unread', ku: 'نەخوێندراوەکان' },
  noUnread: { ar: 'لا توجد إشعارات غير مقروءة', en: 'No unread notifications', ku: 'هیچ ئاگادارکردنەوەیەکی نەخوێندراو نییە' },
  noneYet: { ar: 'لا توجد إشعارات بعد', en: 'No notifications yet', ku: 'هێشتا هیچ ئاگادارکردنەوەیەک نییە' },
  justNow: { ar: 'الآن', en: 'Just now', ku: 'ئێستا' },
  minAgo: { ar: 'منذ {n} دقيقة', en: '{n}m ago', ku: '{n} خولەک لەمەوبەر' },
  hourAgo: { ar: 'منذ {n} ساعة', en: '{n}h ago', ku: '{n} کاتژمێر لەمەوبەر' },
  dayAgo: { ar: 'منذ {n} يوم', en: '{n}d ago', ku: '{n} ڕۆژ لەمەوبەر' },
} satisfies CopyDict;

export const ACCOUNT_SETTINGS_COPY = {
  completeAbove: { ar: 'أكمل المعلومات أعلاه أولاً', en: 'Complete the fields above first', ku: 'سەرەتا زانیارییەکانی سەرەوە تەواو بکە' },
  updating: { ar: 'جاري التحديث...', en: 'Updating...', ku: 'نوێ دەکرێتەوە...' },
  changePassword: { ar: 'تغيير كلمة المرور', en: 'Change Password', ku: 'گۆڕینی وشەی نهێنی' },
  currentPassword: { ar: 'كلمة المرور الحالية', en: 'Current Password', ku: 'وشەی نهێنی ئێستا' },
  newPassword: { ar: 'كلمة المرور الجديدة', en: 'New Password', ku: 'وشەی نهێنی نوێ' },
  changing: { ar: 'جاري التغيير...', en: 'Changing...', ku: 'دەگۆڕدرێت...' },
  updatePassword: { ar: 'تحديث كلمة المرور', en: 'Update Password', ku: 'نوێکردنەوەی وشەی نهێنی' },
  dangerZone: { ar: 'منطقة الخطر', en: 'Danger Zone', ku: 'ناوچەی مەترسی' },
  passwordToConfirm: { ar: 'كلمة المرور للتأكيد', en: 'Password to confirm', ku: 'وشەی نهێنی بۆ پشتڕاستکردنەوە' },
  deleting: { ar: 'جاري الحذف...', en: 'Deleting...', ku: 'دەسڕدرێتەوە...' },
} satisfies CopyDict;

export const DELETED_LISTINGS_COPY = {
  actionFailed: { ar: 'تعذر تنفيذ الإجراء', en: 'The action could not be completed', ku: 'نەتوانرا کارەکە جێبەجێ بکرێت' },
  confirmErase: { ar: 'سيتم محو "{name}" نهائياً مع جميع وثائقه. لا يمكن التراجع عن هذا الإجراء. هل تريد المتابعة؟', en: 'Permanently erase "{name}" and all its documents? This cannot be undone.', ku: '"{name}" و هەموو بەڵگەنامەکانی بە یەکجاری دەسڕدرێنەوە. ئەم کارە ناگەڕێتەوە. دەتەوێت بەردەوام بیت؟' },
  deleted: { ar: 'المحذوفات', en: 'Deleted', ku: 'سڕاوەکان' },
  restorable: { ar: 'يمكن الاستعادة خلال {days} يوماً من الحذف', en: 'Restorable for {days} days after deletion', ku: 'دەکرێت لە ماوەی {days} ڕۆژ دوای سڕینەوە بگەڕێنرێتەوە' },
  deletedOn: { ar: 'حُذف في', en: 'Deleted', ku: 'سڕایەوە لە' },
  erasedOn: { ar: 'يُمحى نهائياً في', en: 'erased on', ku: 'بە یەکجاری دەسڕدرێتەوە لە' },
  restore: { ar: 'استعادة', en: 'Restore', ku: 'گێڕانەوە' },
  eraseNow: { ar: 'محو نهائي', en: 'Erase now', ku: 'سڕینەوەی یەکجاری' },
} satisfies CopyDict;

export const MESSAGE_THREAD_COPY = {
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  noMessages: { ar: 'لا توجد رسائل بعد', en: 'No messages yet', ku: 'هێشتا هیچ نامەیەک نییە' },
  writeMessage: { ar: 'اكتب رسالة...', en: 'Write a message...', ku: 'نامەیەک بنووسە...' },
  send: { ar: 'إرسال', en: 'Send', ku: 'ناردن' },
} satisfies CopyDict;

export const OWNER_REVIEWS_COPY = {
  none: { ar: 'لا توجد تقييمات معتمدة بعد', en: 'No approved reviews yet', ku: 'هێشتا هیچ هەڵسەنگاندنێکی پەسەندکراو نییە' },
  yourReply: { ar: 'ردّك', en: 'Your reply', ku: 'وەڵامەکەت' },
  writeReply: { ar: 'اكتب رداً علنياً...', en: 'Write a public reply...', ku: 'وەڵامێکی ئاشکرا بنووسە...' },
  postReply: { ar: 'نشر الرد', en: 'Post reply', ku: 'بڵاوکردنەوەی وەڵام' },
} satisfies CopyDict;

export const NOTIFICATIONS_TOGGLE_COPY = {
  allowInBrowser: { ar: 'يجب السماح بالإشعارات من إعدادات المتصفح', en: 'You need to allow notifications in your browser settings', ku: 'پێویستە لە ڕێکخستنەکانی وێبگەڕەکەت ڕێگە بە ئاگادارکردنەوەکان بدەیت' },
  enableFailed: { ar: 'تعذر تفعيل الإشعارات', en: 'Failed to enable notifications', ku: 'نەتوانرا ئاگادارکردنەوەکان چالاک بکرێن' },
  title: { ar: 'إشعارات المتصفح', en: 'Browser Notifications', ku: 'ئاگادارکردنەوەکانی وێبگەڕ' },
  subscribedHint: { ar: 'ستصلك إشعارات عند تحديث حالة حجوزاتك وطلبات القبول', en: "You'll be notified about booking and admission status changes", ku: 'کاتێک دۆخی حیجزەکانت و داواکارییەکانی وەرگرتنت بگۆڕێت ئاگادار دەکرێیتەوە' },
  unsubscribedHint: { ar: 'فعّل الإشعارات لمتابعة حالة حجوزاتك وطلباتك فوراً', en: 'Enable notifications to hear about your bookings and applications right away', ku: 'ئاگادارکردنەوەکان چالاک بکە بۆ ئەوەی دەستبەجێ دۆخی حیجز و داواکارییەکانت بزانیت' },
  disable: { ar: 'إيقاف', en: 'Disable', ku: 'ڕاگرتن' },
  enable: { ar: 'تفعيل', en: 'Enable', ku: 'چالاککردن' },
} satisfies CopyDict;

export const FOCAL_POINT_COPY = {
  label: { ar: 'نقطة تركيز الصورة', en: 'Photo focal point', ku: 'خاڵی ناوەندی وێنە' },
  hint: { ar: 'انقر على وجهك في الصورة لتحديد كيفية اقتصاصها في البطاقات المربعة.', en: 'Click your face in the photo to control how it gets cropped in square preview cards.', ku: 'کلیک لە ڕووخسارت بکە لە وێنەکەدا بۆ دیاریکردنی چۆنیەتی بڕینی لە کارتە چوارگۆشەکاندا.' },
  preview: { ar: 'معاينة', en: 'Preview', ku: 'پێشبینین' },
} satisfies CopyDict;

export const LISTING_STATUS_COPY = {
  submitForReview: { ar: 'إرسال للمراجعة', en: 'Submit for review', ku: 'ناردن بۆ پێداچوونەوە' },
  approve: { ar: 'اعتماد', en: 'Approve', ku: 'پەسەندکردن' },
  suspend: { ar: 'إيقاف', en: 'Suspend', ku: 'ڕاگرتن' },
  activate: { ar: 'تفعيل', en: 'Activate', ku: 'چالاککردن' },
  draft: { ar: 'مسودة', en: 'Draft', ku: 'پێشنووس' },
  pending: { ar: 'قيد المراجعة', en: 'Pending review', ku: 'لە ژێر پێداچوونەوەدایە' },
  active: { ar: 'نشط', en: 'Active', ku: 'چالاک' },
  suspended: { ar: 'متوقف', en: 'Suspended', ku: 'ڕاگیراو' },
} satisfies CopyDict;

export const LISTING_REMOVED_COPY = {
  subjectInstitution: { ar: 'ملف مؤسستك', en: 'Your institution profile', ku: 'پرۆفایلی دامەزراوەکەت' },
  subjectTutor: { ar: 'ملفك كأستاذ', en: 'Your tutor profile', ku: 'پرۆفایلەکەت وەک مامۆستا' },
  subjectEmployer: { ar: 'حساب شركتك/منظمتك', en: 'Your company/organization profile', ku: 'هەژماری کۆمپانیا/ڕێکخراوەکەت' },
  removed: { ar: '{subject} أُزيل من المنصة.', en: '{subject} has been removed from the platform.', ku: '{subject} لە پلاتفۆرمەکە لابرا.' },
  mistake: { ar: 'إذا كنت تعتقد أن ذلك حدث عن طريق الخطأ، تواصل مع الإدارة — يمكن استعادة الملف خلال فترة محدودة.', en: 'If you think this was a mistake, contact the administrator — a removed profile can be restored for a limited time.', ku: 'ئەگەر پێتوایە ئەمە بە هەڵە ڕوویداوە، پەیوەندی بە بەڕێوەبەرەوە بکە — پرۆفایلی لابراو لە ماوەیەکی دیاریکراودا دەگەڕێنرێتەوە.' },
} satisfies CopyDict;
