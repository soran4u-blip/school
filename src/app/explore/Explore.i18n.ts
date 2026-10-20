import type { CopyDict } from '@/lib/useT';

// Strings for the explore directory and its _components. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const EXPLORE_COPY = {
  // Page
  crumbHome: { ar: 'دليل العراق التعليمي', en: 'Eduraq Directory', ku: 'ڕێبەری پەروەردەیی عێراق' },
  crumbExplore: { ar: 'استكشاف وتصفية المؤسسات', en: 'Explore & Facets', ku: 'گەڕان و فلتەرکردنی دامەزراوەکان' },
  title: { ar: 'دليل المدارس والجامعات والمعاهد في العراق', en: 'Iraq education directory', ku: 'ڕێبەری قوتابخانە، زانکۆ و پەیمانگاکانی عێراق' },
  intro: { ar: 'تصفح وقارن بين المؤسسات التعليمية المدرجة في كافة المحافظات، مع تفاصيل الأقساط ومعايير القبول.', en: 'Filter and compare education listings across Iraq, with tuition and admissions details.', ku: 'دامەزراوە پەروەردەییە تۆمارکراوەکانی هەموو پارێزگاکان ببینە و بەراوردیان بکە، لەگەڵ وردەکاری کرێی خوێندن و مەرجەکانی وەرگرتن.' },
  filterResults: { ar: 'تصفية النتائج والفلاتر', en: 'Filter Results', ku: 'فلتەرکردنی ئەنجامەکان' },
  listingsCount: { ar: '{n} مؤسسة', en: '{n} listings', ku: '{n} دامەزراوە' },
  activeFilters: { ar: 'الفلاتر النشطة', en: 'Active filters', ku: 'فلتەرە چالاکەکان' },
  filteredBy: { ar: 'تصفية حسب:', en: 'Filtered by:', ku: 'فلتەر بەپێی:' },
  clearAll: { ar: 'مسح الكل', en: 'Clear all', ku: 'سڕینەوەی هەموو' },
  verifiedOnly: { ar: 'موثق فقط', en: 'Verified only', ku: 'تەنیا پشتڕاستکراوەکان' },
  accreditationsFilter: { ar: 'اعتمادات', en: 'Accreditations', ku: 'دانپێدانانەکان' },
  curriculaFilter: { ar: 'مناهج', en: 'Curricula', ku: 'مەنهەجەکان' },
  ratingFilter: { ar: 'تقييم', en: 'Rating', ku: 'هەڵسەنگاندن' },
  unfilteredSearch: { ar: 'بحث بدون فلاتر', en: 'Unfiltered search', ku: 'گەڕان بێ فلتەر' },
  locationUnsupported: { ar: 'المتصفح لا يدعم تحديد الموقع', en: 'Location is not supported by this browser', ku: 'وێبگەڕەکە پشتگیری دیاریکردنی شوێن ناکات' },
  locationDenied: { ar: 'تعذر الوصول إلى الموقع', en: 'Could not access your location', ku: 'نەتوانرا دەستم بە شوێنەکەت بگات' },

  // Filter sidebar
  filters: { ar: 'فلاتر البحث', en: 'Filters', ku: 'فلتەرەکانی گەڕان' },
  filterBy: { ar: 'تصفية حسب', en: 'Filter By', ku: 'فلتەر بەپێی' },
  reset: { ar: 'إعادة ضبط', en: 'Reset', ku: 'دووبارە ڕێکخستن' },
  keywordSearch: { ar: 'البحث بالاسم أو الكلمة المفتاحية', en: 'Keyword Search', ku: 'گەڕان بە ناو یان وشەی سەرەکی' },
  keywordPlaceholder: { ar: 'مثال: بغداد، طب، بريطاني...', en: 'e.g. Medicine, British...', ku: 'بۆ نموونە: بەغدا، پزیشکی، بەریتانی...' },
  annualBudget: { ar: 'الميزانية السنوية', en: 'Annual Budget', ku: 'بودجەی ساڵانە' },
  min: { ar: 'من', en: 'Min', ku: 'لە' },
  max: { ar: 'إلى', en: 'Max', ku: 'تا' },
  minRating: { ar: 'الحد الأدنى للتقييم', en: 'Minimum Rating', ku: 'کەمترین هەڵسەنگاندن' },
  any: { ar: 'الكل', en: 'Any', ku: 'هەموو' },
  nearMeOn: { ar: 'القريب مني مفعّل', en: 'Near Me is on', ku: 'نزیک من چالاکە' },
  nearMe: { ar: 'البحث بالقرب مني', en: 'Search Near Me', ku: 'گەڕان لە نزیکی من' },
  withinKm: { ar: 'ضمن {km} كم', en: 'Within {km} km', ku: 'لە ماوەی {km} کیلۆمەتر' },
  category: { ar: 'الفئة التعليمية', en: 'Category', ku: 'پۆلی پەروەردەیی' },
  allCategories: { ar: 'كافة الفئات', en: 'All Categories', ku: 'هەموو پۆلەکان' },
  governorateLabel: { ar: 'المحافظة العراقية', en: 'Governorate (18)', ku: 'پارێزگای عێراق (18)' },
  allGovernorates: { ar: 'كافة محافظات العراق (18)', en: 'All Iraqi Governorates (18)', ku: 'هەموو پارێزگاکانی عێراق (18)' },
  accreditation: { ar: 'الاعتماد والترخيص الرسمي', en: 'Official Accreditation', ku: 'دانپێدانان و مۆڵەتی فەرمی' },
  curriculum: { ar: 'المنهج الدراسي', en: 'Curriculum', ku: 'مەنهەجی خوێندن' },
  ministryVerified: { ar: 'المؤسسات الموثقة وزارياً فقط', en: 'Verified by Ministry Only', ku: 'تەنیا دامەزراوە پشتڕاستکراوەکانی وەزارەت' },
  applyFilters: { ar: 'تطبيق الفلاتر', en: 'Apply Filters', ku: 'جێبەجێکردنی فلتەرەکان' },

  // Results header
  found: { ar: 'تم العثور على', en: 'Found', ku: 'دۆزرایەوە' },
  foundListings: { ar: 'مؤسسة تعليمية مدرجة', en: 'education listings', ku: 'دامەزراوەی پەروەردەیی تۆمارکراو' },
  searchSaved: { ar: 'تم الحفظ', en: 'Saved', ku: 'پاشەکەوتکرا' },
  saveSearch: { ar: 'حفظ هذا البحث', en: 'Save this search', ku: 'پاشەکەوتکردنی ئەم گەڕانە' },
  sort: { ar: 'الترتيب حسب:', en: 'Sort:', ku: 'ڕیزکردن بەپێی:' },
  sortRecommended: { ar: 'الموصى به (مميز)', en: 'Recommended', ku: 'پێشنیارکراو (تایبەت)' },
  sortRating: { ar: 'الأعلى تقييماً', en: 'Highest Rated', ku: 'بەرزترین هەڵسەنگاندن' },
  sortReviews: { ar: 'الأكثر تقييمات', en: 'Most Reviewed', ku: 'زۆرترین هەڵسەنگاندن' },
  sortTuition: { ar: 'الأقل قسطاً', en: 'Lowest Tuition', ku: 'کەمترین کرێی خوێندن' },
  sortDistance: { ar: 'الأقرب مسافة', en: 'Nearest Distance', ku: 'نزیکترین دووری' },

  // Institution card
  noReviews: { ar: 'لا توجد تقييمات', en: 'No reviews', ku: 'هیچ هەڵسەنگاندنێک نییە' },
  free: { ar: 'مجاني', en: 'Free', ku: 'بێبەرامبەر' },
  free100: { ar: 'مجاني 100%', en: '100% Free', ku: '100% بێبەرامبەر' },
  perYear: { ar: 'سنوياً', en: 'yr', ku: 'ساڵانە' },
  shortlistRemove: { ar: 'إزالة من القائمة المختصرة', en: 'Remove from shortlist', ku: 'لابردن لە لیستی کورتکراوە' },
  shortlistAdd: { ar: 'إضافة إلى القائمة المختصرة', en: 'Add to shortlist', ku: 'زیادکردن بۆ لیستی کورتکراوە' },
  saved: { ar: 'محفوظ', en: 'Saved', ku: 'پاشەکەوتکراو' },
  save: { ar: 'احفظ', en: 'Save', ku: 'پاشەکەوت' },
  added: { ar: 'تمت الإضافة', en: 'Added', ku: 'زیادکرا' },
  compare: { ar: 'قارن', en: 'Compare', ku: 'بەراورد' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', ku: 'واتسئاپ' },
  viewProfile: { ar: 'التفاصيل والقبول', en: 'View Profile', ku: 'وردەکاری و وەرگرتن' },

  // Compare tray
  compareTitle: { ar: 'مقارنة المؤسسات', en: 'Compare institutions', ku: 'بەراوردکردنی دامەزراوەکان' },
  compareSelected: { ar: '{n}/3 مضافة', en: '{n}/3 selected', ku: '{n}/3 هەڵبژێردراو' },
  compareClear: { ar: 'مسح المقارنة', en: 'Clear', ku: 'پاککردنەوە' },
  compareRemove: { ar: 'إزالة {name} من المقارنة', en: 'Remove {name} from comparison', ku: 'لابردنی {name} لە بەراورد' },
  tuition: { ar: 'القسط', en: 'Tuition', ku: 'کرێی خوێندن' },
  rating: { ar: 'التقييم', en: 'Rating', ku: 'هەڵسەنگاندن' },
  verified: { ar: 'موثق', en: 'Verified', ku: 'پشتڕاستکراو' },
  yes: { ar: 'نعم', en: 'Yes', ku: 'بەڵێ' },
  no: { ar: 'لا', en: 'No', ku: 'نەخێر' },
  compareNote: { ar: 'قارن المعلومات الأساسية قبل فتح التفاصيل والتواصل مع المؤسسة.', en: 'Compare the essentials before opening a profile or contacting a school.', ku: 'زانیارییە سەرەکییەکان بەراورد بکە پێش کردنەوەی وردەکارییەکان و پەیوەندیکردن بە دامەزراوەکە.' },

  // Shortlist tray
  shortlistTitle: { ar: 'قائمتي المختصرة', en: 'My shortlist', ku: 'لیستی کورتکراوەکەم' },
  shortlistCount: { ar: '{n} مؤسسة محفوظة', en: '{n} saved listings', ku: '{n} دامەزراوەی پاشەکەوتکراو' },
  shortlistClear: { ar: 'مسح القائمة', en: 'Clear', ku: 'پاککردنەوەی لیست' },
  shortlistRemoveItem: { ar: 'إزالة {name}', en: 'Remove {name}', ku: 'لابردنی {name}' },
  shortlistNote: { ar: 'القائمة محفوظة على هذا الجهاز لتسهيل العودة والمقارنة.', en: 'Your shortlist is saved on this device so you can return and compare later.', ku: 'لیستەکە لەسەر ئەم ئامێرە پاشەکەوت کراوە بۆ ئاسانکاری لە گەڕانەوە و بەراوردکردن.' },

  // Empty results / skeleton
  emptyTitle: { ar: 'لا توجد نتائج مطابقة لبحثك', en: 'No Matching Institutions Found', ku: 'هیچ ئەنجامێکی گونجاو نییە' },
  emptyNote: { ar: 'جرّب إزالة أحد الفلاتر أو اسأل مجتمع الأهالي عن خيارات مناسبة في محافظتك.', en: 'Try removing a filter, or ask the parent community for recommendations in your governorate.', ku: 'یەکێک لە فلتەرەکان لابە، یان لە کۆمەڵگەی دایک و باوکان بپرسە بۆ ڕاسپاردە لە پارێزگاکەتدا.' },
  emptyReset: { ar: 'إعادة ضبط كافة الفلاتر', en: 'Reset All Filters', ku: 'دووبارە ڕێکخستنی هەموو فلتەرەکان' },
  askCommunity: { ar: 'اسأل المجتمع', en: 'Ask the community', ku: 'لە کۆمەڵگە بپرسە' },
  loadingDirectory: { ar: 'جارٍ تحميل الدليل', en: 'Loading directory', ku: 'ڕێبەرەکە باردەکرێت' },
} satisfies CopyDict;
