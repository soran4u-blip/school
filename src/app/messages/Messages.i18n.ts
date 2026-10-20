import type { CopyDict } from '@/lib/useT';

// Strings for the unified messages inbox. Sorani is a draft pending native review
// (see docs/ku-review-notes.md).
export const MESSAGES_COPY = {
  signInTitle: { ar: 'سجّل الدخول لعرض رسائلك', en: 'Sign in to view your messages', ku: 'بچۆ ژوورەوە بۆ بینینی نامەکانت' },
  signInBody: { ar: 'ستجد هنا محادثات الحجوزات والاستفسارات والتواصل المباشر.', en: 'Your bookings, inquiries, and direct conversations will appear here.', ku: 'لێرە گفتوگۆکانی حیجز و پرسیار و پەیوەندی ڕاستەوخۆت دەبینیت.' },
  signIn: { ar: 'تسجيل الدخول', en: 'Sign in', ku: 'چوونەژوورەوە' },
  booking: { ar: 'حجز', en: 'Booking', ku: 'حیجز' },
  inquiry: { ar: 'استفسار', en: 'Inquiry', ku: 'پرسیار' },
  tutor: { ar: 'أستاذ', en: 'Tutor', ku: 'مامۆستا' },
  institution: { ar: 'مؤسسة', en: 'Institution', ku: 'دامەزراوە' },
  employer: { ar: 'صاحب عمل', en: 'Employer', ku: 'خاوەنکار' },
  student: { ar: 'طالب', en: 'Student', ku: 'قوتابی' },
  messages: { ar: 'الرسائل', en: 'Messages', ku: 'نامەکان' },
  chats: { ar: 'محادثة', en: 'chats', ku: 'گفتوگۆ' },
  searchChats: { ar: 'بحث عن محادثة...', en: 'Search messages...', ku: 'گەڕان بۆ گفتوگۆ...' },
  loadingChats: { ar: 'جاري تحميل المحادثات...', en: 'Loading conversations...', ku: 'گفتوگۆکان باردەکرێن...' },
  noChats: { ar: 'لا توجد محادثات حتى الآن', en: 'No conversations yet', ku: 'هێشتا هیچ گفتوگۆیەک نییە' },
  startChatHint: { ar: 'يمكنك بدء محادثة من صفحة الأستاذ أو طلبات الحجز', en: 'Start chatting from a tutor profile or booking card', ku: 'دەتوانیت لە پەڕەی مامۆستا یان کارتی حیجزەوە گفتوگۆ دەستپێبکەیت' },
  user: { ar: 'مستخدم', en: 'User', ku: 'بەکارهێنەر' },
  newConversation: { ar: 'محادثة جديدة', en: 'New conversation', ku: 'گفتوگۆی نوێ' },
  loadingMessages: { ar: 'تحميل الرسائل...', en: 'Loading messages...', ku: 'نامەکان باردەکرێن...' },
  noMessages: { ar: 'لا توجد رسائل بعد', en: 'No messages yet', ku: 'هێشتا هیچ نامەیەک نییە' },
  sendFirst: { ar: 'أرسل أول رسالة لبدء المحادثة', en: 'Send a message to start the conversation', ku: 'یەکەم نامە بنێرە بۆ دەستپێکردنی گفتوگۆ' },
  typeMessage: { ar: 'اكتب رسالة...', en: 'Type a message...', ku: 'نامەیەک بنووسە...' },
  send: { ar: 'إرسال', en: 'Send', ku: 'ناردن' },
  centerTitle: { ar: 'مركز المحادثات والرسائل', en: 'Messages Center', ku: 'ناوەندی گفتوگۆ و نامەکان' },
  centerHint: { ar: 'اختر محادثة من القائمة الجانبية لبدء التواصل الفوري مع الطلاب أو الأساتذة', en: 'Select a conversation from the sidebar to chat in real-time with students or tutors', ku: 'گفتوگۆیەک لە لیستی لای تەنیشتەوە هەڵبژێرە بۆ پەیوەندیکردنی ڕاستەوخۆ لەگەڵ قوتابیان یان مامۆستایان' },
} satisfies CopyDict;
