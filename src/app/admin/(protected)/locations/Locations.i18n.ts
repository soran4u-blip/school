import type { CopyDict } from '@/lib/useT';

// Strings for the admin governorates and cities page and its panels. Sorani is a draft pending
// native review (see docs/ku-review-notes.md).
export const LOCATIONS_COPY = {
  // Page
  fillRequired: { ar: 'يرجى ملء جميع الحقول المطلوبة', en: 'Please fill all required fields', ku: 'تکایە هەموو خانە پێویستەکان پڕبکەرەوە' },
  govSaved: { ar: 'تم حفظ المحافظة بنجاح في قاعدة البيانات', en: 'Governorate saved successfully to master database', ku: 'پارێزگاکە بە سەرکەوتوویی لە بنکەی داتای سەرەکی پاشەکەوت کرا' },
  cityFillDetails: { ar: 'يرجى إدخال اسم وقضاء المدينة', en: 'Please fill city details', ku: 'تکایە ناو و ناوچەی شارەکە بنووسە' },
  citySaved: { ar: 'تم حفظ المدينة/المنطقة بنجاح', en: 'City saved successfully', ku: 'شار/ناوچەکە بە سەرکەوتوویی پاشەکەوت کرا' },
  confirmDeleteGov: { ar: 'هل أنت متأكد من حذف هذه المحافظة؟', en: 'Are you sure you want to delete this governorate?', ku: 'دڵنیایت لە سڕینەوەی ئەم پارێزگایە؟' },
  govDeleted: { ar: 'تم حذف المحافظة بنجاح', en: 'Governorate deleted', ku: 'پارێزگاکە بە سەرکەوتوویی سڕایەوە' },
  title: { ar: 'إدارة المحافظات والمدن في العراق', en: 'Iraqi Governorates & Cities Manager', ku: 'بەڕێوەبردنی پارێزگا و شارەکانی عێراق' },
  intro: { ar: 'تحكم بنسبة 100% في كافة محافظات العراق الـ 18، إضافة وتعديل المدن والأقضية وتفعيلها فورياً.', en: '100% dynamic control over all 18 governorates, municipal cities, and regions in Iraq.', ku: 'کۆنتڕۆڵی تەواو بەسەر هەموو 18 پارێزگاکەی عێراقدا، زیادکردن و دەستکاریکردنی شار و قەزاکان و دەستبەجێ چالاککردنیان.' },
  addGov: { ar: '+ إضافة محافظة عراقية جديدة', en: '+ Add New Governorate', ku: '+ زیادکردنی پارێزگای عێراقی نوێ' },

  // Governorates list
  govList: { ar: 'المحافظات المسجلة', en: 'Governorates List', ku: 'پارێزگا تۆمارکراوەکان' },
  liveHydrated: { ar: 'تحديث حي', en: 'Live Hydrated', ku: 'نوێکردنەوەی ڕاستەوخۆ' },
  institutions: { ar: 'مؤسسة', en: 'institutions', ku: 'دامەزراوە' },
  edit: { ar: 'تعديل', en: 'Edit', ku: 'دەستکاری' },
  delete: { ar: 'حذف', en: 'Delete', ku: 'سڕینەوە' },

  // Governorate form
  formAdd: { ar: 'إضافة محافظة جديدة', en: 'Add New Governorate', ku: 'زیادکردنی پارێزگای نوێ' },
  formEdit: { ar: 'تعديل بيانات المحافظة', en: 'Edit Governorate', ku: 'دەستکاریکردنی زانیاری پارێزگا' },
  govId: { ar: 'معرّف المحافظة (ID)', en: 'Governorate ID (slug)', ku: 'ناسنامەی پارێزگا (ID)' },
  govCode: { ar: 'رمز المحافظة (Code)', en: 'Code', ku: 'کۆدی پارێزگا (Code)' },
  nameAr: { ar: 'الاسم بالعربية', en: 'Name (Arabic)', ku: 'ناو بە عەرەبی' },
  nameEn: { ar: 'الاسم بالإنجليزية', en: 'Name (English)', ku: 'ناو بە ئینگلیزی' },
  region: { ar: 'الإقليم / المنطقة', en: 'Region', ku: 'هەرێم / ناوچە' },
  regionCentral: { ar: 'Central (الوسط)', en: 'Central (الوسط)', ku: 'Central (ناوەڕاست)' },
  regionKurdistan: { ar: 'Kurdistan (إقليم كوردستان)', en: 'Kurdistan (إقليم كوردستان)', ku: 'Kurdistan (هەرێمی کوردستان)' },
  regionSouth: { ar: 'South (الجنوب)', en: 'South (الجنوب)', ku: 'South (باشوور)' },
  regionNorth: { ar: 'North (الشمال)', en: 'North (الشمال)', ku: 'North (باکوور)' },
  regionWest: { ar: 'West (الغرب)', en: 'West (الغرب)', ku: 'West (ڕۆژئاوا)' },
  latitude: { ar: 'خط العرض (Lat)', en: 'Latitude', ku: 'هێڵی پانی (Lat)' },
  longitude: { ar: 'خط الطول (Lng)', en: 'Longitude', ku: 'هێڵی درێژی (Lng)' },
  activeInSearch: { ar: 'المحافظة مفعّلة في نتائج البحث', en: 'Active in search results', ku: 'پارێزگاکە لە ئەنجامەکانی گەڕان چالاکە' },
  cancel: { ar: 'إلغاء', en: 'Cancel', ku: 'هەڵوەشاندنەوە' },
  saveGov: { ar: 'حفظ التغييرات', en: 'Save Governorate', ku: 'پاشەکەوتکردنی گۆڕانکارییەکان' },

  // Cities panel
  citiesIn: { ar: 'المدن والأقضية التابعة لـ', en: 'Cities & Districts in', ku: 'شار و قەزاکانی سەر بە' },
  citiesIntro: { ar: 'إدارة المدن والبلديات ومناطق هذه المحافظة بدقة.', en: 'Manage specific cities and municipal zones.', ku: 'بەڕێوەبردنی وردی شار و شارەوانی و ناوچەکانی ئەم پارێزگایە.' },
  addCity: { ar: 'إضافة قضاء / مدينة', en: '+ Add City', ku: 'زیادکردنی قەزا / شار' },
  newCityDetails: { ar: 'بيانات المدينة / القضاء الجديد', en: 'New City Details', ku: 'زانیاری شار / قەزای نوێ' },
  cityId: { ar: 'المعرف (ID)', en: 'ID', ku: 'ناسنامە (ID)' },
  cityNameAr: { ar: 'الاسم بالعربية', en: 'Arabic Name', ku: 'ناوی عەرەبی' },
  cityNameEn: { ar: 'الاسم بالإنجليزية', en: 'English Name', ku: 'ناوی ئینگلیزی' },
  saveCity: { ar: 'حفظ المدينة', en: 'Save City', ku: 'پاشەکەوتکردنی شار' },
  colNameAr: { ar: 'الاسم بالعربية', en: 'Arabic', ku: 'عەرەبی' },
  colNameEn: { ar: 'الاسم بالإنجليزية', en: 'English', ku: 'ئینگلیزی' },
  colSlug: { ar: 'المعرّف', en: 'Slug', ku: 'ناسێنەر' },
  colStatus: { ar: 'الحالة', en: 'Status', ku: 'دۆخ' },
  active: { ar: 'مفعّل', en: 'Active', ku: 'چالاک' },
  noCities: { ar: 'لم يتم إضافة مدن فرعية لهذه المحافظة بعد. اضغط على "+ إضافة قضاء / مدينة" لإضافة أول مدينة.', en: 'No cities registered yet for this governorate.', ku: 'هێشتا هیچ شارێک بۆ ئەم پارێزگایە زیاد نەکراوە. کلیک لە "+ زیادکردنی قەزا / شار" بکە بۆ زیادکردنی یەکەم شار.' },
} satisfies CopyDict;
