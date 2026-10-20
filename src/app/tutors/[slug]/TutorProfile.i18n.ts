import type { CopyDict } from '@/lib/useT';

// Strings for the public tutor profile, its booking dialog and reviews. Sorani is a draft pending
// native review (see docs/ku-review-notes.md).
export const TUTOR_PROFILE_COPY = {
  // Header and details
  chatNow: { ar: 'مراسلة فورية', en: 'Chat Now', ku: 'گفتوگۆی ڕاستەوخۆ' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', ku: 'واتسئاپ' },
  chatContextTitle: { ar: 'دروس مع {name}', en: 'Tutoring with {name}', ku: 'وانە لەگەڵ {name}' },
  whatsappMessage: { ar: 'مرحباً، أود الاستفسار عن الدروس الخصوصية مع {name}', en: "Hi, I'd like to ask about private tutoring with {name}", ku: 'سڵاو، دەمەوێت دەربارەی وانەی تایبەت لەگەڵ {name} بپرسم' },
  yearsExperience: { ar: '{n} سنوات خبرة', en: '{n} years of experience', ku: '{n} ساڵ ئەزموون' },
  modeONLINE: { ar: 'عن بعد', en: 'Online', ku: 'ئۆنلاین' },
  modeIN_PERSON: { ar: 'حضوري', en: 'In Person', ku: 'بە ئامادەبوون' },
  modeHYBRID: { ar: 'مختلط', en: 'Hybrid', ku: 'تێکەڵ' },
  individualSession: { ar: 'جلسة فردية', en: 'Individual Session', ku: 'وانەی تاک' },
  iqd: { ar: 'د.ع.', en: 'IQD', ku: 'د.ع.' },
  groupSession: { ar: 'جلسة جماعية (حتى {n} طلاب)', en: 'Group Session (up to {n})', ku: 'وانەی گروپ (تا {n} قوتابی)' },
  groupTotal: { ar: 'د.ع. إجمالاً — يُقسّم على عدد الطلاب', en: 'IQD total — split across students', ku: 'د.ع. کۆی گشتی — دابەش دەکرێت بەسەر قوتابیان' },

  // Availability calendar
  bookASession: { ar: 'احجز موعداً', en: 'Book a Session', ku: 'کاتێک حیجز بکە' },
  noAvailability: { ar: 'لم يحدد الأستاذ أوقات توفر بعد', en: 'Tutor has not set availability yet', ku: 'مامۆستا هێشتا کاتی بەردەستبوونی دیارینەکردووە' },
  day0: { ar: 'الأحد', en: 'Sun', ku: 'یەکشەممە' },
  day1: { ar: 'الاثنين', en: 'Mon', ku: 'دووشەممە' },
  day2: { ar: 'الثلاثاء', en: 'Tue', ku: 'سێشەممە' },
  day3: { ar: 'الأربعاء', en: 'Wed', ku: 'چوارشەممە' },
  day4: { ar: 'الخميس', en: 'Thu', ku: 'پێنجشەممە' },
  day5: { ar: 'الجمعة', en: 'Fri', ku: 'هەینی' },
  day6: { ar: 'السبت', en: 'Sat', ku: 'شەممە' },
  individualSlot: { ar: 'فردي · {price} د.ع.', en: 'Individual · {price} IQD', ku: 'تاک · {price} د.ع.' },
  startGroup: { ar: 'بدء مجموعة · {price} د.ع.', en: 'Start group · {price} IQD total', ku: 'دەستپێکردنی گروپ · {price} د.ع. کۆی گشتی' },
  booked: { ar: 'محجوز', en: 'Booked', ku: 'حیجزکراوە' },
  groupFull: { ar: 'المجموعة مكتملة', en: 'Group Full', ku: 'گروپەکە پڕە' },
  joinSlot: { ar: 'انضم ({size}/{max}) · {price} د.ع.', en: 'Join ({size}/{max}) · {price} IQD', ku: 'بەشداربە ({size}/{max}) · {price} د.ع.' },

  // Reviews
  reviewsHeading: { ar: 'تقييمات الطلبة وأولياء الأمور', en: 'Student & Parent Reviews', ku: 'هەڵسەنگاندنی قوتابیان و دایک و باوکان' },
  approvedCount: { ar: '{n} تقييم معتمد', en: '{n} approved reviews', ku: '{n} هەڵسەنگاندنی پەسەندکراو' },
  verifiedStudentHint: { ar: 'طالب حجز فعلياً درساً مع هذا الأستاذ', en: 'This student had a real booking with this tutor', ku: 'ئەم قوتابییە بەڕاستی وانەیەکی لەگەڵ ئەم مامۆستایە حیجز کردووە' },
  verifiedStudent: { ar: 'طالب موثّق', en: 'Verified Student', ku: 'قوتابی پشتڕاستکراو' },
  reply: { ar: 'رد {name}', en: "{name}'s reply", ku: 'وەڵامی {name}' },
  noApprovedReviews: { ar: 'لا توجد تقييمات معتمدة بعد. كن أول من يشارك رأيه.', en: 'No approved reviews yet. Be the first to share your experience.', ku: 'هێشتا هیچ هەڵسەنگاندنێکی پەسەندکراو نییە. یەکەم کەس بە کە بۆچوونەکەی هاوبەش دەکات.' },
  writeReview: { ar: 'شارك تقييمك', en: 'Write a Review', ku: 'هەڵسەنگاندنەکەت هاوبەش بکە' },
  reviewThanks: { ar: 'شكراً لك! تم إرسال تقييمك وسيظهر بعد مراجعته من الإدارة.', en: 'Thank you! Your review was submitted and will appear after moderation.', ku: 'سوپاس! هەڵسەنگاندنەکەت نێردرا و دوای پێداچوونەوەی بەڕێوەبەرایەتی دەردەکەوێت.' },
  yourName: { ar: 'اسمك', en: 'Your name', ku: 'ناوت' },
  commentPlaceholder: { ar: 'اكتب تعليقك هنا...', en: 'Write your comment here...', ku: 'کۆمێنتەکەت لێرە بنووسە...' },
  submitting: { ar: 'جاري الإرسال...', en: 'Submitting...', ku: 'دەنێردرێت...' },
  submitReview: { ar: 'إرسال التقييم', en: 'Submit Review', ku: 'ناردنی هەڵسەنگاندن' },
  reviewNameComment: { ar: 'يرجى إدخال الاسم والتعليق', en: 'Please enter your name and comment', ku: 'تکایە ناو و کۆمێنتەکەت بنووسە' },
  reviewWait: { ar: 'يرجى الانتظار قليلاً قبل إرسال تقييم آخر', en: 'Please wait a moment before submitting another review', ku: 'تکایە کەمێک چاوەڕێ بکە پێش ناردنی هەڵسەنگاندنێکی تر' },
  reviewFailed: { ar: 'تعذر إرسال التقييم، حاول مرة أخرى', en: 'Failed to submit review, please try again', ku: 'نەتوانرا هەڵسەنگاندنەکە بنێردرێت، دووبارە هەوڵ بدەرەوە' },

  // Booking dialog
  bookIndividual: { ar: 'حجز جلسة فردية', en: 'Book Individual Session', ku: 'حیجزکردنی وانەی تاک' },
  joinGroup: { ar: 'الانضمام لمجموعة', en: 'Join Group', ku: 'بەشداریکردن لە گروپ' },
  startNewGroup: { ar: 'بدء مجموعة جديدة', en: 'Start New Group', ku: 'دەستپێکردنی گروپی نوێ' },
  confirmMessage: { ar: 'مرحباً، لقد حجزت موعداً معك بتاريخ {date} الساعة {time}. أتطلع للتنسيق معك.', en: 'Hi, I just booked a session with you on {date} at {time}. Looking forward to coordinating with you.', ku: 'سڵاو، من کاتێکم لەگەڵت حیجز کرد لە بەرواری {date} کاتژمێر {time}. چاوەڕێی هەماهەنگی لەگەڵتم.' },
  confirmWhatsApp: { ar: 'تأكيد الموعد عبر واتساب', en: 'Confirm via WhatsApp', ku: 'پشتڕاستکردنەوەی کات لە ڕێگەی واتسئاپەوە' },
  viewBookings: { ar: 'عرض كافة حجوزاتي', en: 'View all my bookings', ku: 'بینینی هەموو حیجزەکانم' },
  repeatWeekly: { ar: 'تكرار أسبوعي', en: 'Repeat weekly', ku: 'دووبارەکردنەوەی هەفتانە' },
  forWeeksBefore: { ar: 'لعدد', en: 'For', ku: 'بۆ ماوەی' },
  forWeeksAfter: { ar: 'أسابيع', en: 'weeks', ku: 'هەفتە' },
  bookingInProgress: { ar: 'جاري الحجز...', en: 'Booking...', ku: 'حیجز دەکرێت...' },
  confirmBooking: { ar: 'تأكيد الحجز', en: 'Confirm Booking', ku: 'پشتڕاستکردنەوەی حیجز' },
  bookingFailed: { ar: 'تعذر إتمام الحجز', en: 'Booking failed', ku: 'نەتوانرا حیجزەکە تەواو بکرێت' },
  bookedWeekly: { ar: 'تم حجز {n} جلسة أسبوعية بنجاح! السعر لكل جلسة: {price} د.ع.{skipped}', en: 'Booked {n} weekly sessions! Price per session: {price} IQD{skipped}', ku: '{n} وانەی هەفتانە بە سەرکەوتوویی حیجز کران! نرخ بۆ هەر وانەیەک: {price} د.ع.{skipped}' },
  bookedSkipped: { ar: ' (تعذر حجز {n} أسبوع بسبب التعارض)', en: " ({n} week(s) couldn't be booked due to a conflict)", ku: ' (نەتوانرا {n} هەفتە حیجز بکرێت بەهۆی تێکچوونی کات)' },
  bookedOne: { ar: 'تم الحجز بنجاح! السعر لكل طالب: {price} د.ع.', en: 'Booked successfully! Price per student: {price} IQD', ku: 'حیجزکردن بە سەرکەوتوویی ئەنجامدرا! نرخ بۆ هەر قوتابییەک: {price} د.ع.' },
} satisfies CopyDict;
