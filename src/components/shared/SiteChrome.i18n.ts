import type { CopyDict } from '@/lib/useT';

// Strings for the site-wide Navbar and Footer. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const CHROME_COPY = {
  // Shared between Navbar and Footer
  whatsapp: { ar: 'واتساب', en: 'WhatsApp', ku: 'واتسئاپ' },
  myAccount: { ar: 'حسابي', en: 'My Account', ku: 'هەژمارەکەم' },
  logOut: { ar: 'تسجيل الخروج', en: 'Log Out', ku: 'چوونەدەرەوە' },
  login: { ar: 'تسجيل الدخول', en: 'Login', ku: 'چوونەژوورەوە' },
  privateTutors: { ar: 'أساتذة خصوصيون', en: 'Private tutors', ku: 'مامۆستای تایبەت' },
  events: { ar: 'الفعاليات', en: 'Events', ku: 'ڕووداوەکان' },
  communityParents: { ar: 'مجتمع الأهالي', en: 'Community', ku: 'کۆمەڵگەی دایک و باوکان' },
  jobOpenings: { ar: 'الوظائف الشاغرة', en: 'Job Openings', ku: 'هەلی کاری بەردەست' },

  // Navbar
  explore: { ar: 'استكشف', en: 'Explore', ku: 'گەڕان' },
  categories: { ar: 'الفئات', en: 'Categories', ku: 'پۆلەکان' },
  byGovernorate: { ar: 'حسب المحافظة', en: 'By Governorate', ku: 'بەپێی پارێزگا' },
  viewAllFilters: { ar: 'عرض كل المؤسسات والفلاتر', en: 'View all listings & filters', ku: 'بینینی هەموو دامەزراوەکان و فلتەرەکان' },
  jobs: { ar: 'الوظائف', en: 'Jobs', ku: 'هەلی کار' },
  tutors: { ar: 'الأساتذة', en: 'Tutors', ku: 'مامۆستایان' },
  community: { ar: 'المجتمع', en: 'Community', ku: 'کۆمەڵگە' },
  messages: { ar: 'الرسائل', en: 'Messages', ku: 'نامەکان' },
  join: { ar: 'انضم إلينا', en: 'Join Eduraq', ku: 'بەشدارمان بە' },
  viewAllMobile: { ar: 'عرض الكل والفلاتر', en: 'View all & filters', ku: 'بینینی هەموو و فلتەرەکان' },
  privateTutorsLong: { ar: 'الأساتذة الخصوصيون', en: 'Private Tutors', ku: 'مامۆستا تایبەتەکان' },
  joinAs: { ar: 'انضم إلينا كأستاذ أو مؤسسة', en: 'Join as Tutor or Institution', ku: 'وەک مامۆستا یان دامەزراوە بەشدارمان بە' },

  // Footer
  tagline: {
    ar: 'منصة وطنية لاكتشاف ومقارنة المدارس والجامعات والمعاهد والبرامج التعليمية في العراق. تعرّف على التفاصيل وتواصل مع الجهات المدرجة مباشرةً.',
    en: 'A national platform for discovering and comparing schools, universities, institutes, programs, and tutors across Iraq.',
    ku: 'پلاتفۆرمێکی نیشتمانییە بۆ دۆزینەوە و بەراوردکردنی قوتابخانە، زانکۆ، پەیمانگا و پڕۆگرامە پەروەردەییەکان لە عێراق. وردەکارییەکان ببینە و ڕاستەوخۆ پەیوەندی بە لایەنە تۆمارکراوەکانەوە بکە.',
  },
  builtFor: { ar: 'مصمم للبحث والمقارنة التعليمية', en: 'Built for education discovery and comparison', ku: 'دروستکراوە بۆ گەڕان و بەراوردکردنی پەروەردەیی' },
  footerCategories: { ar: 'الفئات التعليمية', en: 'Directory Categories', ku: 'پۆلە پەروەردەییەکان' },
  majorGovernorates: { ar: 'أبرز المحافظات', en: 'Major Governorates', ku: 'گرنگترین پارێزگاکان' },
  platformLinks: { ar: 'روابط المنصة والإدارة', en: 'Platform & Admin', ku: 'بەستەرەکانی پلاتفۆرم و بەڕێوەبردن' },
  myBookings: { ar: 'حجوزاتي', en: 'My Bookings', ku: 'پێشوەختکردنەکانم' },
  myApplications: { ar: 'طلبات التوظيف الخاصة بي', en: 'My Job Applications', ku: 'داواکارییەکانی کارم' },
  joinStatus: { ar: 'حالة طلب الانضمام', en: 'Join Application Status', ku: 'دۆخی داواکاری بەشداریکردن' },
  trustCenter: { ar: 'مركز الثقة والتحقق', en: 'Trust & Verification Center', ku: 'ناوەندی متمانە و پشتڕاستکردنەوە' },
  contactWhatsApp: { ar: 'التواصل عبر واتساب', en: 'Contact us on WhatsApp', ku: 'پەیوەندیمان پێوە بکە بە واتسئاپ' },
  rights: { ar: 'جميع الحقوق محفوظة لجمهورية العراق.', en: 'All rights reserved. Republic of Iraq.', ku: 'هەموو مافەکان پارێزراون بۆ کۆماری عێراق.' },
  privacy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy', ku: 'سیاسەتی پاراستنی نهێنی' },
  terms: { ar: 'شروط الاستخدام', en: 'Terms of Use', ku: 'مەرجەکانی بەکارهێنان' },
  engine: { ar: 'تحديث فوري وقاعدة بيانات ديناميكية', en: 'Real-time & Zero Hardcoding Engine', ku: 'نوێکردنەوەی دەستبەجێ و بنکەدراوەی دینامیکی' },
} satisfies CopyDict;
