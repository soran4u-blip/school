import type { CopyDict } from '@/lib/useT';

// Strings for the admin accreditations / curricula / subjects / grades page. Sorani is a draft
// pending native review (see docs/ku-review-notes.md).
export const TAXONOMIES_COPY = {
  fillRequired: { ar: 'يرجى ملء الحقول الإلزامية', en: 'Please fill required fields', ku: 'تکایە خانە پێویستەکان پڕبکەرەوە' },
  saved: { ar: 'تم حفظ التصنيف بنجاح', en: 'Taxonomy saved successfully', ku: 'پۆلێنکردنەکە بە سەرکەوتوویی پاشەکەوت کرا' },
  title: { ar: 'إدارة الاعتمادات والمناهج والمواد', en: 'Accreditations & Taxonomies Manager', ku: 'بەڕێوەبردنی دانپێدانانەکان و مەنهەج و بابەتەکان' },
  intro: { ar: 'التحكم بجميع اعتمادات وزارتي التعليم والتربية، المناهج التعليمية، والمواد الدراسية دون أي كود ثابت.', en: 'Manage ministerial accreditations, curriculums, and school subjects with zero hardcoding.', ku: 'کۆنتڕۆڵکردنی هەموو دانپێدانانەکانی وەزارەتی خوێندنی باڵا و پەروەردە، مەنهەجە خوێندنییەکان و بابەتە خوێندنەکان بەبێ هیچ کۆدێکی چەسپاو.' },
  addNew: { ar: '+ إضافة عنصر جديد', en: '+ Add New Taxonomy Item', ku: '+ زیادکردنی بڕگەی نوێ' },
  tabAccreditation: { ar: 'الاعتمادات الوزارية والدولية', en: 'Accreditations (MoE / MoHESR)', ku: 'دانپێدانانە وەزارییەکان و نێودەوڵەتییەکان' },
  tabCurriculum: { ar: 'المناهج التعليمية', en: 'Curricula (وزاري / دولي)', ku: 'مەنهەجە خوێندنییەکان' },
  tabSubject: { ar: 'المواد الدراسية (خصوصي/وزاري)', en: 'Study Subjects', ku: 'بابەتە خوێندنەکان (تایبەت/وەزاری)' },
  tabLevel: { ar: 'الصفوف الدراسية', en: 'Grades / Student Levels', ku: 'پۆلەکانی خوێندن' },
  formAdd: { ar: 'إضافة عنصر جديد', en: 'Add Item', ku: 'زیادکردنی بڕگەی نوێ' },
  formEdit: { ar: 'تعديل العنصر', en: 'Edit Item', ku: 'دەستکاریکردنی بڕگە' },
  nameAr: { ar: 'الاسم بالعربية', en: 'Name (AR)', ku: 'ناو بە عەرەبی' },
  nameEn: { ar: 'الاسم بالإنجليزية', en: 'Name (EN)', ku: 'ناو بە ئینگلیزی' },
  idLabel: { ar: 'المعرّف (ID)', en: 'ID', ku: 'ناسنامە (ID)' },
  codeFull: { ar: 'الرمز (Code)', en: 'Code', ku: 'کۆد (Code)' },
  badgeStyle: { ar: 'لون الشارة', en: 'Badge Style', ku: 'ڕەنگی نیشانە' },
  badgeEmerald: { ar: 'Emerald (أخضر موثق)', en: 'Emerald (أخضر موثق)', ku: 'Emerald (سەوزی پشتڕاستکراو)' },
  badgeBlue: { ar: 'Blue (أزرق أكاديمي)', en: 'Blue (أزرق أكاديمي)', ku: 'Blue (شینی ئەکادیمی)' },
  badgeAmber: { ar: 'Amber (ذهبي مميز)', en: 'Amber (ذهبي مميز)', ku: 'Amber (زێڕینی تایبەت)' },
  badgeSlate: { ar: 'Slate (رمادي هادئ)', en: 'Slate (رمادي هادئ)', ku: 'Slate (خۆڵەمێشی ئارام)' },
  cancel: { ar: 'إلغاء', en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  saveItem: { ar: 'حفظ العنصر', en: 'Save Item', ku: 'پاشەکەوتکردنی بڕگە' },
  colNameAr: { ar: 'الاسم بالعربية', en: 'Arabic Name', ku: 'ناوی عەرەبی' },
  colNameEn: { ar: 'الاسم بالإنجليزية', en: 'English Name', ku: 'ناوی ئینگلیزی' },
  colCode: { ar: 'الرمز', en: 'Code', ku: 'کۆد' },
  colBadge: { ar: 'معاينة الشارة', en: 'Badge Preview', ku: 'پێشبینینی نیشانە' },
  colActions: { ar: 'إجراءات', en: 'Actions', ku: 'کردارەکان' },
} satisfies CopyDict;
