import type { CopyDict } from '@/lib/useT';

// Strings for the account sign-in page. Sorani is a draft pending native review (see docs/ku-review-notes.md).
export const LOGIN_COPY = {
  notAuthorized: { ar: 'هذا الحساب غير مصرح له بالدخول من هنا', en: 'This account is not authorized to sign in here', ku: 'ئەم هەژمارە ڕێگەپێدراو نییە لێرەوە بچێتە ژوورەوە' },
  invalidCredentials: { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Invalid email or password', ku: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە' },
  enterEmailFirst: { ar: 'أدخل بريدك الإلكتروني أولاً لإعادة تعيين كلمة المرور', en: 'Enter your email above first to reset your password', ku: 'سەرەتا ئیمەیڵەکەت بنووسە بۆ دووبارە دانانی وشەی نهێنی' },
  resetSent: { ar: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', en: 'A password reset link has been sent to your email', ku: 'بەستەری دووبارە دانانی وشەی نهێنی بۆ ئیمەیڵەکەت نێردرا' },
  resetMaybeSent: { ar: 'إذا كان هذا البريد مسجلاً، فسيصلك رابط إعادة تعيين كلمة المرور', en: 'If that email is registered, a password reset link is on its way', ku: 'ئەگەر ئەم ئیمەیڵە تۆمارکرابێت، بەستەری دووبارە دانانی وشەی نهێنی بۆت دێت' },
  title: { ar: 'تسجيل دخول الحساب', en: 'Account Sign In', ku: 'چوونەژوورەوەی هەژمار' },
  bookingHint: { ar: 'سجّل الدخول للمتابعة من الموعد الذي اخترته.', en: 'Sign in to continue with the time you selected.', ku: 'بچۆ ژوورەوە بۆ بەردەوامبوون لەگەڵ ئەو کاتەی هەڵتبژاردووە.' },
  email: { ar: 'البريد الإلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
  password: { ar: 'كلمة المرور', en: 'Password', ku: 'وشەی نهێنی' },
  signIn: { ar: 'تسجيل الدخول', en: 'Sign In', ku: 'چوونەژوورەوە' },
  sending: { ar: 'جاري الإرسال...', en: 'Sending...', ku: 'ناردن بەردەوامە...' },
  forgot: { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?', ku: 'وشەی نهێنیت لەبیرچووە؟' },
  newStudent: { ar: 'طالب جديد؟', en: 'New student?', ku: 'قوتابیی نوێیت؟' },
  createAccount: { ar: 'أنشئ حساباً مجانياً', en: 'Create a free account', ku: 'هەژمارێکی بێبەرامبەر دروست بکە' },
} satisfies CopyDict;
