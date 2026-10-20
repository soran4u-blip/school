import type { CopyDict } from '@/lib/useT';

// Strings for the events listing and event detail pages. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const EVENTS_COPY = {
  // Listing
  crumbDirectory: { ar: 'دليل العراق التعليمي', en: 'Eduraq Directory', ku: 'ڕێبەری پەروەردەیی عێراق' },
  crumbEvents: { ar: 'الفعاليات', en: 'Events', ku: 'ڕووداوەکان' },
  heroTitle: { ar: 'فعاليات تعليمية في العراق', en: 'Education Events Across Iraq', ku: 'ڕووداوی پەروەردەیی لە عێراق' },
  heroIntro: { ar: 'أيام مفتوحة، معارض، وورش عمل ينظمها المؤسسات التعليمية والمنظمات المعتمدة على المنصة.', en: 'Open houses, exhibitions, and workshops hosted by verified institutions and NGOs on the platform.', ku: 'ڕۆژی کراوە، پێشانگا و وۆرکشۆپ کە دامەزراوە پەروەردەییە پشتڕاستکراوەکان و ڕێکخراوەکان لەسەر پلاتفۆرمەکە ڕێکیان دەخەن.' },
  filterResults: { ar: 'تصفية النتائج والفلاتر', en: 'Filter Results', ku: 'فلتەرکردنی ئەنجامەکان' },
  eventsUnit: { ar: 'فعالية', en: 'events', ku: 'ڕووداو' },
  filtersTitle: { ar: 'فلاتر البحث', en: 'Filters', ku: 'فلتەرەکانی گەڕان' },
  filterBy: { ar: 'تصفية حسب', en: 'Filter By', ku: 'فلتەرکردن بەپێی' },
  reset: { ar: 'إعادة ضبط', en: 'Reset', ku: 'دووبارە ڕێکخستن' },
  governorate: { ar: 'المحافظة', en: 'Governorate', ku: 'پارێزگا' },
  allGovernorates: { ar: 'كافة المحافظات', en: 'All Governorates', ku: 'هەموو پارێزگاکان' },
  eventType: { ar: 'نوع الفعالية', en: 'Event Type', ku: 'جۆری ڕووداو' },
  allTypes: { ar: 'كافة الأنواع', en: 'All Types', ku: 'هەموو جۆرەکان' },
  onlineOnly: { ar: 'عبر الإنترنت فقط', en: 'Online Only', ku: 'تەنها ئۆنلاین' },
  applyFilters: { ar: 'تطبيق الفلاتر', en: 'Apply Filters', ku: 'جێبەجێکردنی فلتەرەکان' },
  found: { ar: 'تم العثور على', en: 'Found', ku: 'دۆزرایەوە' },
  upcomingEvents: { ar: 'فعالية قادمة', en: 'upcoming events', ku: 'ڕووداوی داهاتوو' },
  ngo: { ar: 'منظمة', en: 'NGO', ku: 'ڕێکخراو' },
  online: { ar: 'عبر الإنترنت', en: 'Online', ku: 'ئۆنلاین' },
  emptyTitle: { ar: 'لا توجد فعاليات قادمة مطابقة', en: 'No Matching Upcoming Events', ku: 'هیچ ڕووداوێکی داهاتووی گونجاو نییە' },
  emptyHint: { ar: 'جرّب تقليل الفلاتر أو العودة لاحقاً لمزيد من الفعاليات.', en: 'Try broadening your filters, or check back later for new events.', ku: 'فلتەرەکان کەمتر بکەرەوە، یان دواتر بگەڕێوە بۆ ڕووداوی زیاتر.' },
  resetAll: { ar: 'إعادة ضبط كافة الفلاتر', en: 'Reset All Filters', ku: 'دووبارە ڕێکخستنی هەموو فلتەرەکان' },

  // Detail
  aboutEvent: { ar: 'عن الفعالية', en: 'About this event', ku: 'دەربارەی ئەم ڕووداوە' },
  registration: { ar: 'التسجيل في الفعالية', en: 'Registration', ku: 'تۆمارکردن لە ڕووداوەکەدا' },
  unavailable: { ar: 'هذه الفعالية لم تعد متاحة.', en: 'This event is no longer available.', ku: 'ئەم ڕووداوە چیتر بەردەست نییە.' },
  ended: { ar: 'انتهت هذه الفعالية.', en: 'This event has ended.', ku: 'ئەم ڕووداوە کۆتایی هات.' },
  registerNow: { ar: 'التسجيل الآن', en: 'Register Now', ku: 'ئێستا تۆمار بکە' },
  whatsapp: { ar: 'تواصل عبر واتساب', en: 'Contact on WhatsApp', ku: 'پەیوەندی لە ڕێگەی واتسئاپەوە' },
  noRegistration: { ar: 'لا تتطلب هذه الفعالية تسجيلاً مسبقاً.', en: 'No advance registration required for this event.', ku: 'ئەم ڕووداوە پێویستی بە تۆمارکردنی پێشوەختە نییە.' },
} satisfies CopyDict;
