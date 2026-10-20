import type { CopyDict } from '@/lib/useT';

// Strings for the home page sections. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const HOME_COPY = {
  // Hero
  heroEyebrow: { ar: 'دليل العراق التعليمي', en: 'IRAQ EDUCATION DIRECTORY', ku: 'ڕێبەری پەروەردەیی عێراق' },
  heroTitle: { ar: 'مستقبل أكثر إشراقاً لكل متعلم في العراق', en: 'A brighter future for every learner in Iraq', ku: 'داهاتوویەکی گەشتر بۆ هەموو فێرخوازێک لە عێراق' },
  heroIntro: { ar: 'اكتشف المدارس والجامعات والمدرسين وبرامج التدريب والفرص — كل ما تحتاجه في مكان واحد.', en: 'Discover schools, universities, tutors, training programs and opportunities — all in one place.', ku: 'قوتابخانە، زانکۆ، مامۆستا، پڕۆگرامی ڕاهێنان و دەرفەتەکان بدۆزەرەوە — هەموو ئەوەی پێویستتە لە یەک شوێندا.' },
  tabAll: { ar: 'الكل', en: 'All', ku: 'هەموو' },
  tabSchools: { ar: 'المدارس', en: 'Schools', ku: 'قوتابخانەکان' },
  tabUniversities: { ar: 'الجامعات', en: 'Universities', ku: 'زانکۆکان' },
  tabTutors: { ar: 'المدرسون', en: 'Tutors', ku: 'مامۆستایان' },
  tabTraining: { ar: 'التدريب', en: 'Training', ku: 'ڕاهێنان' },
  tabOpportunities: { ar: 'الفرص', en: 'Opportunities', ku: 'دەرفەتەکان' },
  searchPlaceholder: { ar: 'ابحث بالاسم أو التخصص أو الكلمات المفتاحية...', en: 'Search by name, subject, or keyword...', ku: 'بە ناو، بەش یان وشەی سەرەکی بگەڕێ...' },
  governorate: { ar: 'المحافظة', en: 'Governorate', ku: 'پارێزگا' },
  allGovernorates: { ar: 'كل المحافظات', en: 'All Governorates', ku: 'هەموو پارێزگاکان' },
  search: { ar: 'بحث', en: 'Search', ku: 'گەڕان' },

  // Categories grid
  catSchools: { ar: 'المدارس', en: 'Schools', ku: 'قوتابخانەکان' },
  catSchoolsDesc: { ar: 'اعثر على المدرسة المناسبة', en: 'Find the right school', ku: 'قوتابخانەی گونجاو بدۆزەرەوە' },
  catUniversities: { ar: 'الجامعات', en: 'Universities', ku: 'زانکۆکان' },
  catUniversitiesDesc: { ar: 'استكشف التعليم العالي', en: 'Explore higher education', ku: 'خوێندنی باڵا بپشکنە' },
  catTutors: { ar: 'المدرسون', en: 'Tutors', ku: 'مامۆستایان' },
  catTutorsDesc: { ar: 'تعلّم مع مدرسين متخصصين', en: 'Learn with expert tutors', ku: 'لەگەڵ مامۆستای پسپۆڕ فێربە' },
  catTraining: { ar: 'مراكز التدريب', en: 'Training Centres', ku: 'ناوەندەکانی ڕاهێنان' },
  catTrainingDesc: { ar: 'طوّر مهارات جديدة', en: 'Build new skills', ku: 'شارەزایی نوێ بنیات بنێ' },
  catOpportunities: { ar: 'الفرص', en: 'Opportunities', ku: 'دەرفەتەکان' },
  catOpportunitiesDesc: { ar: 'منح وبرامج وفعاليات', en: 'Scholarships, programs & events', ku: 'بورسە، پڕۆگرام و ڕووداو' },
  catCommunity: { ar: 'المجتمع', en: 'Community', ku: 'کۆمەڵگە' },
  catCommunityDesc: { ar: 'اسأل وشارك واستفد', en: 'Ask, share and get advice', ku: 'بپرسە، هاوبەش بکە و سوود وەربگرە' },

  // Ad banner
  sponsored: { ar: 'محتوى برعاية', en: 'Sponsored', ku: 'ناوەڕۆکی سپۆنسەرکراو' },
  openAd: { ar: 'فتح الإعلان', en: 'Open advertisement', ku: 'کردنەوەی ڕیکلام' },
  rotatingAd: { ar: 'إعلان دوّار', en: 'Rotating advertisement', ku: 'ڕیکلامی گۆڕاو' },
  ad: { ar: 'إعلان', en: 'Ad', ku: 'ڕیکلام' },

  // Governorates explorer
  govEyebrow: { ar: 'تغطية وطنية شاملة', en: 'Nationwide coverage', ku: 'ڕووپۆشی نیشتمانی گشتگیر' },
  govTitle: { ar: 'ابحث بالقرب منك، في أي محافظة عراقية', en: 'Find the right place, closer to home', ku: 'لە نزیکی خۆتەوە بگەڕێ، لە هەر پارێزگایەکی عێراق' },
  govIntro: { ar: 'اختر محافظتك لتصفح المدارس والجامعات والمؤسسات التعليمية المتاحة فيها.', en: 'Choose a governorate to browse the schools, universities, and education providers available there.', ku: 'پارێزگاکەت هەڵبژێرە بۆ گەڕان لە قوتابخانە، زانکۆ و دامەزراوە پەروەردەییەکانی ئەوێ.' },
  govSummary: { ar: '{total} محافظة، {available} متاحة الآن', en: '{total} governorates, {available} available now', ku: '{total} پارێزگا، {available} ئێستا بەردەستە' },
  govNoListings: { ar: 'لا توجد مؤسسات بعد', en: 'No listings yet', ku: 'هێشتا هیچ دامەزراوەیەک نییە' },
  govListings: { ar: '{n} مؤسسة', en: '{n} listings', ku: '{n} دامەزراوە' },
  govSoon: { ar: 'سيتم إضافة المؤسسات حسب المحافظة قريباً.', en: 'Listings will be added by governorate soon.', ku: 'دامەزراوەکان بەپێی پارێزگا بەم زووانە زیاد دەکرێن.' },
  govOthers: { ar: 'محافظات أخرى ({n})', en: 'Other governorates ({n})', ku: 'پارێزگاکانی تر ({n})' },
  govOthersNote: { ar: 'هذه المحافظات جاهزة لاستقبال مؤسسات جديدة في الدليل.', en: 'These locations are ready for new institutions to join the directory.', ku: 'ئەم پارێزگایانە ئامادەن بۆ وەرگرتنی دامەزراوەی نوێ لە ڕێبەرەکەدا.' },

  // Upcoming events
  eventsEyebrow: { ar: 'فعاليات قادمة', en: 'Upcoming events', ku: 'ڕووداوە داهاتووەکان' },
  eventsTitle: { ar: 'أيام مفتوحة ومعارض وورش عمل', en: 'Open houses, exhibitions, and workshops', ku: 'ڕۆژی کراوە، پێشانگا و وۆرکشۆپ' },
  eventsIntro: { ar: 'فعاليات منشورة من مؤسسات ومنظمات على المنصة.', en: 'Events published by institutions and NGOs on the platform.', ku: 'ڕووداوی بڵاوکراوە لەلایەن دامەزراوە و ڕێکخراوەکانی سەر پلاتفۆرمەکە.' },
  eventsAll: { ar: 'عرض جميع الفعاليات', en: 'View all events', ku: 'بینینی هەموو ڕووداوەکان' },
  online: { ar: 'عبر الإنترنت', en: 'Online', ku: 'ئۆنلاین' },
  inPerson: { ar: 'حضوري', en: 'In person', ku: 'بە ئامادەبوون' },

  // Featured institutions
  instEyebrow: { ar: 'مؤسسات تعليمية ضمن الدليل', en: 'Institutions in the directory', ku: 'دامەزراوە پەروەردەییەکان لە ڕێبەرەکەدا' },
  instTitle: { ar: 'أبرز الصروح التعليمية في العراق', en: 'Featured Iraqi educational institutions', ku: 'بەناوبانگترین دامەزراوە پەروەردەییەکانی عێراق' },
  instIntro: { ar: 'قارن التفاصيل وتواصل مباشرةً قبل اتخاذ الخطوة التالية.', en: 'Compare the details and contact institutions before your next step.', ku: 'وردەکارییەکان بەراورد بکە و ڕاستەوخۆ پەیوەندی بکە پێش هەنگاوی داهاتوو.' },
  instAll: { ar: 'عرض جميع المؤسسات', en: 'View all institutions', ku: 'بینینی هەموو دامەزراوەکان' },
  noReviews: { ar: 'لا توجد تقييمات', en: 'No reviews', ku: 'هیچ هەڵسەنگاندنێک نییە' },
  listedOnPlatform: { ar: 'مدرج على المنصة', en: 'Listed on Eduraq', ku: 'لە پلاتفۆرمەکەدا تۆمارکراوە' },
  free: { ar: 'مجاني', en: 'Free', ku: 'بێبەرامبەر' },
  perYear: { ar: 'سنوياً', en: 'yr', ku: 'ساڵانە' },
  viewProfile: { ar: 'عرض التفاصيل', en: 'View profile', ku: 'بینینی وردەکارییەکان' },
  contactInstWhatsApp: { ar: 'تواصل عبر واتساب مع {name}', en: 'Contact {name} on WhatsApp', ku: 'لە ڕێگەی واتسئاپەوە پەیوەندی بە {name} بکە' },
  noInstitutions: { ar: 'لا توجد مؤسسات منشورة بعد', en: 'No published institutions yet', ku: 'هێشتا هیچ دامەزراوەیەک بڵاو نەکراوەتەوە' },
  noInstitutionsNote: { ar: 'استكشف المحافظات أو تصفح الدليل الكامل عند إضافة مؤسسات جديدة.', en: 'Explore governorates or browse the full directory as new institutions are added.', ku: 'پارێزگاکان بپشکنە یان ڕێبەری تەواو ببینە کاتێک دامەزراوەی نوێ زیاد دەکرێن.' },
  openDirectory: { ar: 'فتح الدليل الكامل', en: 'Open full directory', ku: 'کردنەوەی ڕێبەری تەواو' },

  // Featured tutors
  tutorsEyebrow: { ar: 'كوادر تعليمية وتدريس خصوصي', en: 'Tutors & Private Educators', ku: 'کادیری پەروەردەیی و وانەی تایبەت' },
  tutorsTitle: { ar: 'نخبة أساتذة التدريس الخصوصي في العراق', en: 'Featured Private Tutors in Iraq', ku: 'مامۆستا تایبەتە بەناوبانگەکانی عێراق' },
  tutorsIntro: { ar: 'احجز جلسات فردية أو جماعية مع أساتذة معتمدين، وتواصل معهم مباشرةً عبر واتساب.', en: 'Book 1-on-1 or group sessions with vetted tutors, and connect directly via WhatsApp.', ku: 'وانەی تاک یان گروپ لەگەڵ مامۆستا پەسەندکراوەکان حیجز بکە، و ڕاستەوخۆ لە ڕێگەی واتسئاپەوە پەیوەندییان پێوە بکە.' },
  tutorsAll: { ar: 'استكشف جميع الأساتذة', en: 'Explore all tutors', ku: 'گەڕان بە هەموو مامۆستاکان' },
  deliveryInPerson: { ar: 'حضوري', en: 'In-Person', ku: 'بە ئامادەبوون' },
  deliveryBoth: { ar: 'حضوري وعبر الإنترنت', en: 'In-Person & Online', ku: 'بە ئامادەبوون و ئۆنلاین' },
  newTutor: { ar: 'جديد', en: 'New', ku: 'نوێ' },
  yearsExp: { ar: 'خبرة {n} سنة', en: '{n}y exp', ku: '{n} ساڵ ئەزموون' },
  iraq: { ar: 'العراق', en: 'Iraq', ku: 'عێراق' },
  verifiedInstructor: { ar: 'أستاذ وزاري معتمد وموثّق', en: 'Verified Instructor', ku: 'مامۆستای پشتڕاستکراو' },
  perHour: { ar: 'ساعة', en: 'hr', ku: 'کاتژمێر' },
  groupSlots: { ar: 'متاح مجموعات', en: 'Group slots', ku: 'گروپ بەردەستە' },
  bookSession: { ar: 'احجز جلسة', en: 'Book session', ku: 'وانەیەک حیجز بکە' },
  contactTutorWhatsApp: { ar: 'تواصل عبر واتساب مع {name}', en: 'Contact {name} on WhatsApp', ku: 'لە ڕێگەی واتسئاپەوە پەیوەندی بە {name} بکە' },
  noTutors: { ar: 'لا يوجد أساتذة منشورون حالياً', en: 'No published tutors yet', ku: 'هێشتا هیچ مامۆستایەک بڵاو نەکراوەتەوە' },
  noTutorsNote: { ar: 'كن أول من ينضم إلى نخبة المعلمين المعتمدين في العراق واستقبل طلبات التدريس.', en: 'Be the first to join our vetted educators directory and start receiving student bookings.', ku: 'یەکەم کەس بە کە بەشداری ڕێبەری مامۆستا پەسەندکراوەکان دەکات و داواکاری وانە وەردەگرێت.' },
  applyTutor: { ar: 'تقديم طلب الانضمام كأستاذ', en: 'Apply to Join as a Tutor', ku: 'داواکاری بەشداریکردن وەک مامۆستا' },
  recruitTitle: { ar: 'هل أنت أستاذ أو معلم خصوصي في العراق؟', en: 'Are you a private tutor or teacher in Iraq?', ku: 'ئایا مامۆستا یان وانەبێژی تایبەتیت لە عێراق؟' },
  recruitBody: { ar: 'انضم إلى دليل مدرسي المنصة المعتمدين واستقبل طلبات الحجز المباشرة من آلاف الطلبة وأولياء الأمور.', en: 'Join our vetted tutors directory and start receiving direct booking requests from students across Iraq.', ku: 'بەشداری ڕێبەری مامۆستا پەسەندکراوەکانمان بکە و ڕاستەوخۆ داواکاری حیجز لە هەزاران قوتابی و دایک و باوک وەربگرە.' },
  recruitCta: { ar: 'انضم كأستاذ معتمد', en: 'Apply as a Tutor', ku: 'وەک مامۆستای پەسەندکراو بەشدار بە' },

  // Owner call-to-action banner
  ownersEyebrow: { ar: 'لأصحاب المؤسسات والمدارس', en: 'For School & University Owners', ku: 'بۆ خاوەن دامەزراوە و قوتابخانەکان' },
  ownersTitle: { ar: 'هل تمثل مدرسة أو جامعة أو مركز تدريب في العراق؟', en: 'Are you representing an educational institution in Iraq?', ku: 'ئایا نوێنەرایەتی دامەزراوەیەکی پەروەردەیی دەکەیت لە عێراق؟' },
  ownersBody: { ar: 'انضم إلى أكبر دليل تعليمي وطني موحد للوصول إلى آلاف الطلبة وأولياء الأمور الباحثين عن التسجيل للعام الدراسي الجديد.', en: 'Register your institution on Eduraq to reach thousands of students and parents actively seeking enrollment.', ku: 'بەشداری گەورەترین ڕێبەری پەروەردەیی نیشتمانی یەکگرتوو بکە بۆ گەیشتن بە هەزاران قوتابی و دایک و باوک کە بەدوای تۆمارکردن دەگەڕێن بۆ ساڵی خوێندنی نوێ.' },
  ownersCta: { ar: 'سجل مؤسستك التعليمية الآن', en: '+ Register Your Institution', ku: '+ ئێستا دامەزراوە پەروەردەییەکەت تۆمار بکە' },
} satisfies CopyDict;
