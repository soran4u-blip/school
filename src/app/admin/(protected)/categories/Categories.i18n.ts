import type { CopyDict } from '@/lib/useT';

// Strings for the admin educational-categories page. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const CATEGORIES_COPY = {
  fillRequired: { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields', ku: 'تکایە هەموو خانە پێویستەکان پڕبکەرەوە' },
  saved: { ar: 'تم حفظ الفئة بنجاح في قاعدة البيانات', en: 'Category saved successfully', ku: 'هاوپۆلەکە بە سەرکەوتوویی لە بنکەی داتا پاشەکەوت کرا' },
  title: { ar: 'إدارة الفئات والتصنيفات التعليمية', en: 'Educational Categories Manager', ku: 'بەڕێوەبردنی هاوپۆل و پۆلێنە پەروەردەییەکان' },
  intro: { ar: 'تحديد وتعديل الفئات المستهدفة في الدليل (جامعات، مدارس، معاهد، مراكز تدريب، منظمات، تدريس خصوصي).', en: 'Configure all educational categories, icons, and descriptions dynamically.', ku: 'دیاریکردن و دەستکاریکردنی هاوپۆلەکانی ڕێبەر (زانکۆ، قوتابخانە، پەیمانگا، ناوەندی ڕاهێنان، ڕێکخراو، وانەی تایبەت).' },
  addNew: { ar: '+ إضافة فئة تعليمية جديدة', en: '+ Add New Category', ku: '+ زیادکردنی هاوپۆلی پەروەردەیی نوێ' },
  formAdd: { ar: 'إضافة فئة تعليمية جديدة', en: 'Add Category', ku: 'زیادکردنی هاوپۆلی پەروەردەیی نوێ' },
  formEdit: { ar: 'تعديل الفئة', en: 'Edit Category', ku: 'دەستکاریکردنی هاوپۆل' },
  nameAr: { ar: 'الاسم بالعربية', en: 'Name (Arabic)', ku: 'ناو بە عەرەبی' },
  nameEn: { ar: 'الاسم بالإنجليزية', en: 'Name (English)', ku: 'ناو بە ئینگلیزی' },
  slugFull: { ar: 'المعرّف (Slug)', en: 'Slug', ku: 'ناسێنەر (Slug)' },
  icon: { ar: 'اسم الأيقونة', en: 'Icon', ku: 'ناوی ئایکۆن' },
  iconGraduationCap: { ar: 'GraduationCap (جامعات)', en: 'GraduationCap (جامعات)', ku: 'GraduationCap (زانکۆکان)' },
  iconSchool: { ar: 'School (مدارس)', en: 'School (مدارس)', ku: 'School (قوتابخانەکان)' },
  iconBookOpen: { ar: 'BookOpen (معاهد)', en: 'BookOpen (معاهد)', ku: 'BookOpen (پەیمانگاکان)' },
  iconAward: { ar: 'Award (مراكز تدريب)', en: 'Award (مراكز تدريب)', ku: 'Award (ناوەندەکانی ڕاهێنان)' },
  iconHeartHandshake: { ar: 'HeartHandshake (منظمات)', en: 'HeartHandshake (منظمات)', ku: 'HeartHandshake (ڕێکخراوەکان)' },
  iconUserCheck: { ar: 'UserCheck (أساتذة)', en: 'UserCheck (أساتذة)', ku: 'UserCheck (مامۆستایان)' },
  order: { ar: 'ترتيب العرض', en: 'Order', ku: 'ڕیزبەندی پیشاندان' },
  descAr: { ar: 'الوصف بالعربية', en: 'Description (AR)', ku: 'وەسف بە عەرەبی' },
  descEn: { ar: 'الوصف بالإنجليزية', en: 'Description (EN)', ku: 'وەسف بە ئینگلیزی' },
  cancel: { ar: 'إلغاء', en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  saveCategory: { ar: 'حفظ الفئة', en: 'Save Category', ku: 'پاشەکەوتکردنی هاوپۆل' },
  active: { ar: 'مفعّل', en: 'Active', ku: 'چالاک' },
  slugLabel: { ar: 'المعرّف:', en: 'Slug:', ku: 'ناسێنەر:' },
  listings: { ar: 'مؤسسة', en: 'listings', ku: 'دامەزراوە' },
} satisfies CopyDict;
