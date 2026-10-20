import type { CopyDict } from '@/lib/useT';

// Strings for the public tutors directory. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const TUTORS_LIST_COPY = {
  locationUnsupported: { ar: 'المتصفح لا يدعم تحديد الموقع', en: 'Location not supported by this browser', ku: 'وێبگەڕەکە پشتگیری دیاریکردنی شوێن ناکات' },
  locationDenied: { ar: 'تعذر الوصول إلى الموقع', en: 'Could not access your location', ku: 'نەتوانرا دەستم بە شوێنەکەت بگات' },
  crumb: { ar: 'دليل العراق التعليمي', en: 'EDURAQ · IRAQ EDUCATION GUIDE', ku: 'ئێدوڕەق · ڕێبەری پەروەردەیی عێراق' },
  title: { ar: 'نخبة أساتذة التدريس الخصوصي', en: 'Private Tutors Directory', ku: 'ڕێبەری مامۆستا تایبەتەکان' },
  intro: { ar: 'تواصل مباشر واحجز جلسات فردية أو جماعية مع أفضل الأساتذة المعتمدين.', en: 'Connect and book individual or group sessions with vetted tutors.', ku: 'ڕاستەوخۆ پەیوەندی بکە و وانەی تاک یان گروپ لەگەڵ باشترین مامۆستا پەسەندکراوەکان حیجز بکە.' },
  searchPlaceholder: { ar: 'ابحث باسم الأستاذ أو التخصص...', en: 'Search tutor name or title...', ku: 'بە ناوی مامۆستا یان پسپۆڕی بگەڕێ...' },
  allGovernorates: { ar: 'كافة المحافظات', en: 'All Governorates', ku: 'هەموو پارێزگاکان' },
  allSubjects: { ar: 'كافة المواد', en: 'All Subjects', ku: 'هەموو بابەتەکان' },
  allGrades: { ar: 'كافة الصفوف', en: 'All Grades', ku: 'هەموو پۆلەکانی خوێندن' },
  allModes: { ar: 'كل طرق التدريس', en: 'All Delivery Modes', ku: 'هەموو شێوازەکانی وانەگوتنەوە' },
  modeOnline: { ar: 'عن بعد', en: 'Online', ku: 'ئۆنلاین' },
  modeInPerson: { ar: 'حضوري', en: 'In Person', ku: 'بە ئامادەبوون' },
  modeHybrid: { ar: 'مختلط', en: 'Hybrid', ku: 'تێکەڵ' },
  maxPrice: { ar: 'السعر الأقصى', en: 'Max price', ku: 'بەرزترین نرخ' },
  currencyIqd: { ar: 'د.ع', en: 'IQD', ku: 'د.ع' },
  currencyUsd: { ar: '$', en: 'USD', ku: '$' },
  any: { ar: 'الكل', en: 'Any', ku: 'هەموو' },
  nearMeOn: { ar: 'القريب مني مفعّل', en: 'Near Me is on', ku: 'نزیک من چالاکە' },
  nearMe: { ar: 'البحث بالقرب مني', en: 'Near Me', ku: 'گەڕان لە نزیکی من' },
  withinKm: { ar: 'ضمن {km} كم', en: 'Within {km} km', ku: 'لە ماوەی {km} کیلۆمەتر' },
  sortRating: { ar: 'الأعلى تقييماً', en: 'Highest Rated', ku: 'بەرزترین هەڵسەنگاندن' },
  sortPrice: { ar: 'الأقل سعراً', en: 'Lowest Price', ku: 'کەمترین نرخ' },
  sortDistance: { ar: 'الأقرب مسافة', en: 'Nearest Distance', ku: 'نزیکترین دووری' },
  empty: { ar: 'لا يوجد أساتذة في هذه المحافظة حالياً', en: 'No tutors in this governorate yet', ku: 'لە ئێستادا هیچ مامۆستایەک لەم پارێزگایەدا نییە' },
  verified: { ar: 'موثّق', en: 'Verified', ku: 'پشتڕاستکراو' },
  individual: { ar: 'فردي', en: 'individual', ku: 'تاک' },
} satisfies CopyDict;
