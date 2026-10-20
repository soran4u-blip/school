import type { CopyDict } from '@/lib/useT';

// Strings for the audit log view. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const AUDIT_COPY = {
  loadFailed: { ar: 'تعذر تحميل المزيد', en: 'Could not load more', ku: 'نەتوانرا زیاتر باربکرێت' },
  title: { ar: 'سجل الإجراءات', en: 'Audit Log', ku: 'تۆماری کردارەکان' },
  subtitle: { ar: 'كل إجراء إداري حساس: الاعتماد، التوثيق، الإبراز، الإيقاف، والحذف — ومن نفّذه.', en: 'Every privileged action — approving, verifying, featuring, suspending, deleting — and who performed it.', ku: 'هەموو کردارێکی بەڕێوەبەرایەتی هەستیار: پەسەندکردن، پشتڕاستکردنەوە، دیارخستن، ڕاگرتن و سڕینەوە — و ئەو کەسەی ئەنجامی داوە.' },
  empty: { ar: 'لا توجد إجراءات مسجلة بعد', en: 'No recorded actions yet', ku: 'هێشتا هیچ کردارێک تۆمار نەکراوە' },
  systemTask: { ar: 'النظام (مهمة مجدولة)', en: 'System (scheduled task)', ku: 'سیستەم (ئەرکی خشتەبەندکراو)' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...', ku: 'باردەکرێت...' },
  loadMore: { ar: 'تحميل المزيد', en: 'Load more', ku: 'زیاتر بار بکە' },
} satisfies CopyDict;
