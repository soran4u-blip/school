import type { CopyDict } from '@/lib/useT';

// Sidebar and top-bar strings for the admin shell. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const ADMIN_LAYOUT_COPY = {
  navDashboard: { ar: 'لوحة المؤشرات', en: 'Dashboard', ku: 'داشبۆرد' },
  navAnalytics: { ar: 'التحليلات', en: 'Analytics', ku: 'شیکارییەکان' },
  navLocations: { ar: 'المحافظات والمدن', en: 'Governorates & Cities', ku: 'پارێزگا و شارەکان' },
  navCategories: { ar: 'الفئات والأنواع', en: 'Categories & Types', ku: 'پۆل و جۆرەکان' },
  navTaxonomies: { ar: 'الاعتمادات والمناهج', en: 'Accreditations & Taxonomies', ku: 'دانپێدانانەکان و مەنهەجەکان' },
  navBanners: { ar: 'الإعلانات', en: 'Ad Banners', ku: 'ڕیکلامەکان' },
  navInstitutions: { ar: 'إدارة المؤسسات التعليمية', en: 'Institutions Directory', ku: 'بەڕێوەبردنی دامەزراوە پەروەردەییەکان' },
  navTutors: { ar: 'إدارة الأساتذة الخصوصيين', en: 'Private Tutors', ku: 'مامۆستایانی تایبەت' },
  navBookings: { ar: 'كافة الحجوزات', en: 'All Bookings', ku: 'هەموو حیجزەکان' },
  navJobs: { ar: 'الوظائف الشاغرة', en: 'Job Postings', ku: 'هەلە کارییەکان' },
  navEmployers: { ar: 'الشركات والمنظمات', en: 'Companies & NGOs', ku: 'کۆمپانیا و ڕێکخراوەکان' },
  navApplications: { ar: 'طلبات الانضمام', en: 'Join Applications', ku: 'داواکارییەکانی پەیوەستبوون' },
  navReviews: { ar: 'التقييمات والاستفسارات', en: 'Reviews & Inquiries', ku: 'هەڵسەنگاندن و پرسیارەکان' },
  navCommunity: { ar: 'مجتمع الأهالي', en: 'Community', ku: 'کۆمەڵگەی دایک و باوکان' },
  navAudit: { ar: 'سجل الإجراءات', en: 'Audit Log', ku: 'تۆماری کردارەکان' },
  navErrors: { ar: 'أخطاء النظام', en: 'System Errors', ku: 'هەڵەکانی سیستەم' },
  navSettings: { ar: 'إعدادات النظام واللافتات', en: 'System Settings & CMS', ku: 'ڕێکخستنەکانی سیستەم و ناوەڕۆک' },
  closeNav: { ar: 'إغلاق القائمة', en: 'Close navigation', ku: 'داخستنی لیست' },
  openNav: { ar: 'فتح القائمة', en: 'Open navigation', ku: 'کردنەوەی لیست' },
  moderatorAccess: { ar: 'صلاحيات الإشراف', en: 'Moderator access', ku: 'دەسەڵاتی پێداچوونەوە' },
  editorAccess: { ar: 'صلاحيات التحرير', en: 'Editor access', ku: 'دەسەڵاتی دەستکاریکردن' },
  superadminSuite: { ar: 'لوحة تحكم السوبر أدمن', en: 'Superadmin Suite', ku: 'پانێڵی سوپەر ئەدمین' },
  backToSite: { ar: 'العودة للموقع الرئيسي', en: 'Back to Public Website', ku: 'گەڕانەوە بۆ ماڵپەڕی سەرەکی' },
  logout: { ar: 'تسجيل الخروج', en: 'Log Out', ku: 'چوونەدەرەوە' },
  administration: { ar: 'إدارة النظام', en: 'Administration', ku: 'بەڕێوەبردنی سیستەم' },
  overview: { ar: 'نظرة عامة', en: 'Overview', ku: 'پوختە' },
  messages: { ar: 'الرسائل', en: 'Messages', ku: 'نامەکان' },
  dbLive: { ar: 'قاعدة البيانات متصلة وجاهزة', en: 'Firebase Live Connected', ku: 'بنکەی داتا پەیوەستە و ئامادەیە' },
} satisfies CopyDict;
