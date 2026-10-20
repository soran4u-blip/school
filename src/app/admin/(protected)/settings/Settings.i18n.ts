import type { CopyDict } from '@/lib/useT';

// Strings for the system settings page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const SETTINGS_COPY = {
  saved: { ar: 'تم حفظ إعدادات النظام بنجاح وتطبيقها فورياً', en: 'System settings saved successfully', ku: 'ڕێکخستنەکانی سیستەم بە سەرکەوتوویی پاشەکەوتکران' },
  saveFailed: { ar: 'تعذر حفظ الإعدادات', en: 'Could not save settings', ku: 'نەتوانرا ڕێکخستنەکان پاشەکەوت بکرێن' },
  countersOk: { ar: 'كل العدادات متطابقة مع مصدرها — لا شيء بحاجة إلى إصلاح.', en: 'All counters match their source — nothing needed repair.', ku: 'هەموو ژمێرەکان لەگەڵ سەرچاوەکەیان یەکدەگرنەوە — هیچ شتێک پێویستی بە چاککردن نییە.' },
  repairFailed: { ar: 'تعذر إصلاح العدادات', en: 'Could not repair counters', ku: 'نەتوانرا ژمێرەکان چاک بکرێنەوە' },
  title: { ar: 'إعدادات النظام واللافتات العامة', en: 'System Settings & Announcements', ku: 'ڕێکخستنەکانی سیستەم و ڕاگەیاندنەکان' },
  subtitle: { ar: 'التحكم في شريط الإعلانات العاجل، سعر صرف الدينار العراقي، ومعلومات التواصل الرسمية للمنصة.', en: 'Manage site-wide announcement banners, exchange rates, and official contacts.', ku: 'کۆنتڕۆڵکردنی تەختەی ڕاگەیاندنی بەپەلە، نرخی دینارەکەی عێراق و زانیاری پەیوەندی فەرمی پلاتفۆرم.' },
  tickerTitle: { ar: 'شريط التنبيهات والإعلانات العاجلة أعلى الموقع', en: 'Emergency Top Announcement Ticker', ku: 'تەختەی ڕاگەیاندنی بەپەلەی سەرەوە' },
  enableTicker: { ar: 'تفعيل الشريط العاجل', en: 'Enable Announcement', ku: 'چالاککردنی ڕاگەیاندن' },
  textAr: { ar: 'نص الإعلان (بالعربية)', en: 'Announcement Text (Arabic)', ku: 'دەقی ڕاگەیاندن (بە عەرەبی)' },
  textEn: { ar: 'نص الإعلان (بالإنجليزية)', en: 'Announcement Text (English)', ku: 'دەقی ڕاگەیاندن (بە ئینگلیزی)' },
  currencyTitle: { ar: 'العملة وسعر الصرف التقريبي', en: 'Currency & Exchange Rate', ku: 'دراو و نرخی ئاڵوگۆڕ' },
  exchangeRate: { ar: 'سعر صرف الدولار مقابل الدينار العراقي (1 USD = X IQD)', en: 'USD to IQD Exchange Rate', ku: 'نرخی ئاڵوگۆڕی دۆلار بەرانبەر دینار' },
  contactTitle: { ar: 'بيانات الاتصال والدعم الرسمي للمنصة', en: 'Official Contact & Support', ku: 'زانیاری پەیوەندی و پشتگیری فەرمی' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  phone: { ar: 'رقم الهاتف الرسمي', en: 'Official Phone', ku: 'ژمارەی تەلەفۆنی فەرمی' },
  whatsapp: { ar: 'واتساب الاستفسارات', en: 'WhatsApp Support', ku: 'واتسئاپی پرسیارەکان' },
  saveAll: { ar: 'حفظ وتطبيق جميع الإعدادات', en: 'Save System Settings', ku: 'پاشەکەوتکردنی ڕێکخستنەکانی سیستەم' },
  countersTitle: { ar: 'صيانة العدادات', en: 'Counter Maintenance', ku: 'چاککردنی ژمێرەکان' },
  countersBody: { ar: 'يعيد احتساب متوسط التقييمات وعدد المراجعات لكل مؤسسة ومدرّس، وعدد المتقدمين لكل وظيفة، انطلاقاً من البيانات الأصلية. آمن للتشغيل في أي وقت.', en: "Recomputes each institution and tutor's rating average and review count, and each job's applicant count, from the underlying records. Safe to run at any time.", ku: 'تێکڕای هەڵسەنگاندن و ژمارەی پێداچوونەوەکانی هەر دامەزراوە و مامۆستایەک، و ژمارەی داواکارانی هەر هەلێکی کار، لە تۆمارە بنەڕەتییەکانەوە دووبارە دەژمێرێتەوە. هەر کاتێک بتەوێت دەتوانیت بەبێ مەترسی کاری پێ بکەیت.' },
  checking: { ar: 'جاري الفحص...', en: 'Checking...', ku: 'پشکنین...' },
  checkRepair: { ar: 'فحص وإصلاح العدادات', en: 'Check & repair counters', ku: 'پشکنین و چاککردنی ژمێرەکان' },
  repairedOne: { ar: 'تم إصلاح {n} عداداً.', en: 'Repaired {n} counter.', ku: '{n} ژمێر چاککرایەوە.' },
  repairedMany: { ar: 'تم إصلاح {n} عداداً.', en: 'Repaired {n} counters.', ku: '{n} ژمێر چاککرانەوە.' },
} satisfies CopyDict;
