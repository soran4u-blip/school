import type { CopyDict } from '@/lib/useT';

// Strings for the admin dashboard home. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ADMIN_HOME_COPY = {
  title: { ar: 'لوحة تحكم السوبر أدمن - إدارة دليل العراق', en: 'Superadmin Dashboard - Eduraq Master Control', ku: 'داشبۆردی سوپەر ئەدمین - کۆنتڕۆڵی سەرەکی ئێدوڕەق' },
  subtitle: { ar: 'إدارة مركزية كاملة لكافة المحافظات، المدن، الفئات، والتصنيفات بدقة ودون أي كود ثابت (Zero Hardcoding).', en: 'Full real-time control over all Iraqi governorates, cities, categories, and taxonomies without hardcoded data.', ku: 'کۆنتڕۆڵی تەواوی ڕاستەوخۆ بەسەر هەموو پارێزگا، شار، پۆل و پۆلێنەکانی عێراقدا بەبێ داتای چەسپاو.' },
  addLocation: { ar: 'إضافة محافظة أو مدينة', en: 'Add Location', ku: 'زیادکردنی شوێن' },
  addInstitution: { ar: 'إضافة مؤسسة جديدة', en: 'Add Institution', ku: 'زیادکردنی دامەزراوە' },
  governorates: { ar: 'المحافظات المسجلة', en: 'Governorates', ku: 'پارێزگاکان' },
  iraqCovered: { ar: 'مغطاة في العراق', en: 'Iraq Covered', ku: 'عێراق داپۆشراوە' },
  categories: { ar: 'الفئات التعليمية', en: 'Categories', ku: 'پۆلەکان' },
  dynamic: { ar: 'ديناميكية بالكامل', en: 'Dynamic', ku: 'دینامیکی' },
  institutions: { ar: 'المؤسسات المسجلة', en: 'Institutions', ku: 'دامەزراوەکان' },
  active: { ar: 'نشطة', en: 'active', ku: 'چالاک' },
  verified: { ar: 'موثقة', en: 'verified', ku: 'پشتڕاستکراو' },
  privateTutors: { ar: 'الأساتذة الخصوصيون', en: 'Private Tutors', ku: 'مامۆستایانی تایبەت' },
  vettedTutors: { ar: 'مدرّس معتمد', en: 'Vetted Tutors', ku: 'مامۆستای پشکنراو' },
  zeroHardcoding: { ar: 'نظام إدارة البيانات الحصري بدون كود ثابت', en: 'Zero-Hardcoding Architecture Active', ku: 'ئەندازیاری بێ-داتای-چەسپاو چالاکە' },
  totalControl: { ar: 'تحكم كامل في جميع مدخلات الدليل من مكان واحد', en: 'Total Control Over Every Input, City, and Category', ku: 'کۆنتڕۆڵی تەواو بەسەر هەموو داخڵکراو، شار و پۆلێکدا' },
  bannerBody: { ar: 'يمكنك إضافة أي محافظة عراقية جديدة، قضاء أو ناحية، فئة تعليمية، اعتماد وزاري، أو منهاج دراسي مباشرة من لوحة التحكم، وستظهر فوراً لجميع المستخدمين في الفلاتر وقوائم البحث.', en: 'Add any new Iraqi governorate, district, category, accreditation, or curriculum directly from the dashboard. Changes reflect immediately in live search facets.', ku: 'دەتوانیت هەر پارێزگا، قەزا، پۆلی پەروەردەیی، دانپێدانان یان مەنهەجێکی نوێی عێراقی ڕاستەوخۆ لە داشبۆردەوە زیاد بکەیت. گۆڕانکارییەکان یەکسەر لە فلتەرە ڕاستەوخۆکانی گەڕاندا دەردەکەون.' },
  manageData: { ar: 'إدارة البيانات الآن', en: 'Manage Master Data', ku: 'بەڕێوەبردنی داتای سەرەکی' },
  govCities: { ar: 'المحافظات والمدن والأقضية', en: 'Governorates & Cities', ku: 'پارێزگا و شارەکان' },
  govCitiesHint: { ar: 'إضافة وتعديل وترتيب 18 محافظة وكافة المدن والمناطق في العراق.', en: 'Manage 18 governorates, municipal cities, and districts.', ku: 'بەڕێوەبردنی 18 پارێزگا، شارە شارەوانییەکان و قەزاکان.' },
  catSub: { ar: 'الفئات والتصنيفات الفرعية', en: 'Categories & Subcategories', ku: 'پۆل و ژێرپۆلەکان' },
  catSubHint: { ar: 'تخصيص الفئات (جامعات، مدارس، معاهد، منظمات) مع أيقوناتها.', en: 'Configure educational categories, badges, and sub-types.', ku: 'ڕێکخستنی پۆلە پەروەردەییەکان، نیشانەکان و ژێرجۆرەکان.' },
  accCurricula: { ar: 'الاعتمادات الوزارية والمناهج', en: 'Accreditations & Curricula', ku: 'دانپێدانان و مەنهەجەکان' },
  accCurriculaHint: { ar: 'إدارة اعتمادات وزارتي التربية والتعليم العالي والمناهج الدولية.', en: 'Define Ministry accreditations, curricula, and exam subjects.', ku: 'پێناسەکردنی دانپێدانانەکانی وەزارەت، مەنهەجەکان و بابەتەکانی تاقیکردنەوە.' },
} satisfies CopyDict;
