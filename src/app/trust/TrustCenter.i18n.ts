import type { CopyDict } from '@/lib/useT';

// Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const TRUST_COPY = {
  verifiedTitle: { ar: 'موثق ومحدث', en: 'Verified and current', ku: 'پشتڕاستکراوە و نوێکراوەتەوە' },
  verifiedBody: { ar: 'تمت مراجعة بيانات الاعتماد مع وجود مصدر وتاريخ تحقق صالح.', en: 'The listing has reviewed evidence with a valid source and verification date.', ku: 'بەڵگەکانی ئەم تۆمارە پێداچوونەوەیان بۆ کراوە و سەرچاوە و بەرواری پشتڕاستکردنەوەی دروستی هەیە.' },
  staleTitle: { ar: 'يحتاج تحديث الأدلة', en: 'Evidence refresh needed', ku: 'بەڵگەکان پێویستیان بە نوێکردنەوە هەیە' },
  staleBody: { ar: 'كان الملف موثقاً، لكن مصدر التحقق يحتاج إلى تحديث قبل عرض الادعاء الرسمي.', en: 'The profile was verified, but its evidence needs refreshing before the official claim is shown.', ku: 'پرۆفایلەکە پێشتر پشتڕاستکرابووەوە، بەڵام بەڵگەکانی دەبێت نوێ بکرێنەوە پێش ئەوەی ئیدیعای فەرمی پیشان بدرێت.' },
  unverifiedTitle: { ar: 'غير موثق', en: 'Not verified', ku: 'پشتڕاستنەکراوەتەوە' },
  unverifiedBody: { ar: 'المعلومات مقدمة للتعريف فقط. تواصل مباشرة مع الجهة للتحقق من المتطلبات الحالية.', en: 'The information is for discovery only. Contact the provider directly to confirm current requirements.', ku: 'زانیارییەکان تەنیا بۆ ناساندنن. ڕاستەوخۆ پەیوەندی بە لایەنەکەوە بکە بۆ دڵنیابوون لە مەرجە ئێستاکان.' },
  crumb: { ar: 'دليل العراق التعليمي / مركز الثقة', en: 'Eduraq Directory / Trust Center', ku: 'ڕێبەری پەروەردەیی عێراق / ناوەندی متمانە' },
  heading: { ar: 'اعرف ماذا تعني كل شارة', en: 'Know what every badge means', ku: 'بزانە هەر نیشانەیەک چی دەگەیەنێت' },
  intro: { ar: 'نوضح كيف نراجع الملفات، ومتى نعرض الاعتماد، وما الذي يجب أن تتحقق منه قبل اتخاذ قرار تعليمي.', en: 'We explain how profiles are reviewed, when accreditation is shown, and what you should confirm before making an education decision.', ku: 'ڕوونی دەکەینەوە چۆن پرۆفایلەکان پێداچوونەوەیان بۆ دەکرێت، کەی دانپێدانان پیشان دەدرێت، و پێش بڕیاری پەروەردەیی دەبێت چی دڵنیا بکەیتەوە.' },
  reviewHeading: { ar: 'ما الذي نراجعه؟', en: 'What we review', ku: 'چی پێداچوونەوە دەکەین؟' },
  reviewAuthority: { ar: 'الجهة المصدرة للاعتماد ورابط الدليل', en: 'Accreditation authority and evidence URL', ku: 'لایەنی دەرکەری دانپێدانان و بەستەری بەڵگە' },
  reviewDates: { ar: 'تاريخ التحقق وتاريخ انتهاء الدليل', en: 'Verification date and evidence expiry', ku: 'بەرواری پشتڕاستکردنەوە و بەسەرچوونی بەڵگە' },
  reviewContact: { ar: 'بيانات التواصل والعنوان واللغة', en: 'Contact details, address, and language', ku: 'زانیاری پەیوەندی، ناونیشان و زمان' },
  reviewClarity: { ar: 'وضوح الرسوم والقبول والبرامج', en: 'Tuition, admissions, and program clarity', ku: 'ڕوونی کرێی خوێندن، وەرگرتن و پڕۆگرامەکان' },
  noteHeading: { ar: 'تنبيه مهم', en: 'Important note', ku: 'تێبینییەکی گرنگ' },
  noteBody: { ar: 'لا تضمن Eduraq القبول أو جودة النتيجة أو ثبات الرسوم. استخدم الملف كبداية، ثم تواصل مع الجهة مباشرة لتأكيد المعلومات قبل الدفع أو التقديم.', en: 'Eduraq does not guarantee admission, outcomes, or unchanged pricing. Use a profile as a starting point, then contact the provider directly before paying or applying.', ku: 'ئێدوڕەق گەرەنتی وەرگرتن، ئەنجام یان نەگۆڕانی نرخ ناکات. پرۆفایلەکە وەک سەرەتا بەکاربهێنە، پاشان پێش پارەدان یان داواکاری ڕاستەوخۆ پەیوەندی بە لایەنەکەوە بکە بۆ دڵنیابوون لە زانیارییەکان.' },
  explore: { ar: 'استكشف الملفات الموثقة', en: 'Explore verified profiles', ku: 'پرۆفایلە پشتڕاستکراوەکان ببینە' },
} satisfies CopyDict;
