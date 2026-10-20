import type { CopyDict } from '@/lib/useT';

// Strings for the community moderation page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const ADMIN_COMMUNITY_COPY = {
  loadFailed: { ar: 'تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', en: 'Failed to load data. Make sure you are signed in as superadmin.', ku: 'نەتوانرا داتا باربکرێت. دڵنیابە وەک سوپەر ئەدمین چوویتە ژوورەوە.' },
  confirmDelete: { ar: 'هل تريد حذف هذا النقاش نهائياً؟', en: 'Permanently delete this discussion?', ku: 'دەتەوێت ئەم گفتوگۆیە بە یەکجاری بسڕیتەوە؟' },
  title: { ar: 'مجتمع الأهالي', en: 'Community', ku: 'کۆمەڵگە' },
  subtitle: { ar: 'راجع النقاشات الجديدة قبل ظهورها للعامة.', en: 'Review new discussions before they go public.', ku: 'گفتوگۆ نوێیەکان پێداچوونەوەیان بۆ بکە پێش ئەوەی بۆ گشتی دەربکەون.' },
  pendingReview: { ar: 'قيد المراجعة', en: 'Pending Review', ku: 'چاوەڕێی پێداچوونەوە' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  emptyPending: { ar: 'لا توجد نقاشات قيد المراجعة', en: 'No pending discussions', ku: 'هیچ گفتوگۆیەک لە چاوەڕێی پێداچوونەوەدا نییە' },
  approve: { ar: 'موافقة', en: 'Approve', ku: 'پەسەندکردن' },
  reject: { ar: 'رفض', en: 'Reject', ku: 'ڕەتکردنەوە' },
  allDiscussions: { ar: 'كل النقاشات', en: 'All Discussions', ku: 'هەموو گفتوگۆکان' },
  emptyAll: { ar: 'لا توجد نقاشات بعد', en: 'No discussions yet', ku: 'هێشتا هیچ گفتوگۆیەک نییە' },
  replies: { ar: 'ردود', en: 'replies', ku: 'وەڵامەکان' },
  delete: { ar: 'حذف', en: 'Delete', ku: 'سڕینەوە' },
} satisfies CopyDict;
