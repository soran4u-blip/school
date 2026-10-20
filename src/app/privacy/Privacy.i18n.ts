import type { LegalContent } from '../privacy/LegalPage';

// Legal copy. The Sorani text is a literal draft and needs review by a legal-minded native speaker
// (see docs/ku-review-notes.md) before it is relied on.
export const PRIVACY_CONTENT: Record<'ar' | 'en' | 'ku', LegalContent> = {
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: سبتمبر 2026',
    sections: [
      {
        h: 'المعلومات التي نجمعها',
        p: 'عند إنشاء حساب طالب، نجمع اسمك الكامل ورقم هاتفك وبريدك الإلكتروني، وبشكل اختياري مدرستك وصفك الدراسي والمواد التي تهمك. عند حجز درس خصوصي أو التقديم على برنامج أكاديمي، نجمع بيانات الحجز أو الطلب (التاريخ والوقت والمستمسكات المرفقة إن وجدت). كما نجمع تقييمات وأسئلة تنشرها بشكل علني (المجتمع، التقييمات)، وبيانات تسجيل الدخول للأساتذة والمؤسسات وأصحاب العمل.',
      },
      {
        h: 'كيف نستخدم بياناتك',
        p: 'نستخدم بياناتك لتشغيل حجوزاتك وطلبات القبول، وتوصيلك بالأساتذة والمؤسسات التي تتفاعل معها، وعرض حالة طلباتك في حسابك، وتحسين الدليل التعليمي. لا نبيع بياناتك الشخصية لأطراف ثالثة.',
      },
      {
        h: 'من يرى بياناتك',
        p: 'عند حجز درس أو التقديم على برنامج، يرى الأستاذ أو المؤسسة المعنية اسمك ورقم هاتفك وبريدك الإلكتروني والمستندات التي ترفقها، وذلك فقط لغرض التواصل معك بخصوص طلبك. تقييماتك ومشاركاتك في المجتمع تكون علنية إذا اعتمدها فريق الإشراف.',
      },
      {
        h: 'التخزين والخدمات الخارجية',
        p: 'نخزّن بياناتك باستخدام خدمات Google Firebase (المصادقة، قاعدة البيانات، والتخزين السحابي)، والتي تخضع لسياسات الخصوصية والأمان الخاصة بجوجل. نستخدم واتساب كقناة اختيارية للتواصل المباشر بناءً على اختيارك.',
      },
      {
        h: 'ملفات تعريف الارتباط والتخزين المحلي',
        p: 'نستخدم التخزين المحلي في متصفحك (localStorage) لتذكر تفضيل اللغة، ولمنع إرسال طلبات متكررة من نفس الجهاز خلال فترة قصيرة (منع الإزعاج/السبام). لا نستخدم إعلانات تتبع من أطراف ثالثة.',
      },
      {
        h: 'حقوقك',
        p: 'يمكنك تعديل بيانات ملفك الشخصي في أي وقت من صفحة حسابي. يمكنك أيضاً طلب حذف حسابك وبياناتك بالتواصل معنا عبر البريد الإلكتروني أدناه، وسنقوم بحذف بياناتك خلال مدة معقولة إلا ما يلزم الاحتفاظ به لأغراض قانونية أو نزاعات قائمة.',
      },
      {
        h: 'التواصل',
        p: 'لأي استفسار بخصوص خصوصيتك، راسلنا على support@eduraq.iq.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: September 2026',
    sections: [
      {
        h: 'Information We Collect',
        p: "When you create a student account, we collect your full name, phone number, and email, and optionally your school, grade level, and subjects of interest. When you book a tutoring session or apply to an academic program, we collect the related booking or application details (date, time, and any attached documents). We also collect content you post publicly (community posts, reviews), and login credentials for tutors, institutions, and employers.",
      },
      {
        h: 'How We Use Your Data',
        p: 'We use your data to operate your bookings and admission applications, connect you with the tutors and institutions you interact with, show you the status of your requests in your account, and improve the directory. We do not sell your personal data to third parties.',
      },
      {
        h: 'Who Can See Your Data',
        p: "When you book a session or apply to a program, the relevant tutor or institution sees your name, phone number, email, and any documents you attach — solely to contact you about your request. Your reviews and community posts are public once approved by our moderation team.",
      },
      {
        h: 'Storage & Third-Party Services',
        p: 'We store your data using Google Firebase (Authentication, Firestore database, and Cloud Storage), which is subject to Google\'s own security and privacy practices. WhatsApp is offered as an optional direct-contact channel at your choice.',
      },
      {
        h: 'Cookies & Local Storage',
        p: 'We use your browser\'s local storage to remember your language preference and to prevent repeated submissions from the same device within a short window (spam prevention). We do not use third-party advertising trackers.',
      },
      {
        h: 'Your Rights',
        p: 'You can update your profile information at any time from your account page. You may also request deletion of your account and data by emailing us below; we will delete your data within a reasonable period except where retention is required for legal or dispute-resolution purposes.',
      },
      {
        h: 'Contact',
        p: 'For any privacy questions, reach us at support@eduraq.iq.',
      },
    ],
  },
  ku: {
    title: 'سیاسەتی نهێنیێتی',
    updated: 'دوایین نوێکردنەوە: سێپتەمبەری 2026',
    sections: [
      {
        h: 'ئەو زانیارییانەی کۆیان دەکەینەوە',
        p: 'کاتێک هەژماری قوتابی دروست دەکەیت، ناوی تەواو و ژمارەی تەلەفۆن و ئیمەیڵەکەت کۆ دەکەینەوە، و بە شێوەی ئارەزوومەندانە قوتابخانە و پۆلی خوێندن و ئەو بابەتانەی کە گرنگیان پێدەدەیت. کاتێک وانەیەکی تایبەت حیجز دەکەیت یان داواکاری بۆ پڕۆگرامێکی ئەکادیمی دەکەیت، زانیارییەکانی حیجز یان داواکارییەکە (بەروار و کات و بەڵگەنامە هاوپێچکراوەکان ئەگەر هەبن) کۆ دەکەینەوە. هەروەها ئەو هەڵسەنگاندن و پرسیارانە کۆ دەکەینەوە کە بە ئاشکرا بڵاویان دەکەیتەوە (کۆمەڵگە، هەڵسەنگاندنەکان)، و زانیاری چوونەژوورەوەی مامۆستایان و دامەزراوەکان و خاوەنکارەکان.',
      },
      {
        h: 'چۆن زانیارییەکانت بەکاردەهێنین',
        p: 'زانیارییەکانت بەکاردەهێنین بۆ بەڕێوەبردنی حیجزەکانت و داواکارییەکانی وەرگرتن، پەیوەندیکردنت بە مامۆستایان و دامەزراوەکانەوە کە لەگەڵیان کارلێک دەکەیت، پیشاندانی دۆخی داواکارییەکانت لە هەژمارەکەتدا، و باشترکردنی ڕێبەری پەروەردەیی. زانیارییە کەسییەکانت بە لایەنی سێیەم نافرۆشین.',
      },
      {
        h: 'کێ زانیارییەکانت دەبینێت',
        p: 'کاتێک وانەیەک حیجز دەکەیت یان داواکاری بۆ پڕۆگرامێک دەکەیت، مامۆستا یان دامەزراوە پەیوەندیدارەکە ناو و ژمارەی تەلەفۆن و ئیمەیڵ و ئەو بەڵگەنامانە دەبینێت کە هاوپێچیان دەکەیت، تەنها بۆ مەبەستی پەیوەندیکردن پێوەت دەربارەی داواکارییەکەت. هەڵسەنگاندن و بەشداریکردنەکانت لە کۆمەڵگەدا ئاشکرا دەبن ئەگەر تیمی چاودێری پەسەندیان بکات.',
      },
      {
        h: 'هەڵگرتن و خزمەتگوزارییە دەرەکییەکان',
        p: 'زانیارییەکانت هەڵدەگرین بە بەکارهێنانی خزمەتگوزارییەکانی Google Firebase (سەلماندنی ناسنامە، بنکەی زانیاری، و هەڵگرتنی ئەبری)، کە لە ژێر سیاسەتەکانی نهێنیێتی و پاراستنی گووگڵدان. واتسئاپ وەک کەناڵێکی ئارەزوومەندانە بۆ پەیوەندیی ڕاستەوخۆ دابین دەکرێت بەپێی هەڵبژاردنی خۆت.',
      },
      {
        h: 'کووکییەکان و هەڵگرتنی ناوخۆیی',
        p: 'هەڵگرتنی ناوخۆیی (localStorage) لە وێبگەڕەکەتدا بەکاردەهێنین بۆ بیرهێنانەوەی هەڵبژاردنی زمان، و بۆ ڕێگریکردن لە ناردنی داواکاری دووبارە لەو ئامێرەوە لە ماوەیەکی کورتدا (ڕێگری لە بێزارکردن/سپام). ڕیکلامی بەدواداچوونی لایەنی سێیەم بەکارناهێنین.',
      },
      {
        h: 'مافەکانت',
        p: 'دەتوانیت زانیارییەکانی پرۆفایلەکەت لە هەر کاتێکدا لە پەڕەی هەژمارەکەمەوە دەستکاری بکەیت. هەروەها دەتوانیت داوای سڕینەوەی هەژمار و زانیارییەکانت بکەیت بە پەیوەندیکردن پێمانەوە لە ڕێگەی ئیمەیڵی خوارەوە، و زانیارییەکانت لە ماوەیەکی گونجاودا دەسڕینەوە جگە لەوەی کە هەڵگرتنی بۆ مەبەستی یاسایی یان ناکۆکییە بەردەوامەکان پێویست بێت.',
      },
      {
        h: 'پەیوەندی',
        p: 'بۆ هەر پرسیارێک دەربارەی نهێنیێتیت، نامەمان بۆ بنێرە لە support@eduraq.iq.',
      },
    ],
  },
};
