'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { UserCircle2, Loader2 } from 'lucide-react';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  tutor: '/tutor/dashboard',
  student: '/account',
  institution: '/institution/dashboard',
  employer: '/employer/dashboard',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetting, setResetting] = useState(false);
  const redirectTarget = searchParams.get('redirect');
  const bookingSignIn = searchParams.get('reason') === 'booking';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));
      // This portal is for tutors/schools/students only — superadmin keeps its own hidden login.
      if (!res.ok || data.role === 'superadmin' || !DASHBOARD_BY_ROLE[data.role]) {
        await signOut(auth);
        setError(data.error || t('هذا الحساب غير مصرح له بالدخول من هنا', 'This account is not authorized to sign in here'));
        return;
      }

       const redirect = redirectTarget || DASHBOARD_BY_ROLE[data.role];
      router.push(redirect);
      router.refresh();
    } catch {
      setError(t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError(t('أدخل بريدك الإلكتروني أولاً لإعادة تعيين كلمة المرور', 'Enter your email above first to reset your password'));
      return;
    }
    setError('');
    setResetMessage('');
    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage(t('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني', 'A password reset link has been sent to your email'));
    } catch {
      // Same message whether the account exists or not, to avoid leaking which emails are registered.
      setResetMessage(t('إذا كان هذا البريد مسجلاً، فسيصلك رابط إعادة تعيين كلمة المرور', 'If that email is registered, a password reset link is on its way'));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#123D35] px-4">
      <div className="fixed inset-x-4 top-4 flex items-center justify-between text-white">
        <Link href="/" className="font-extrabold tracking-tight hover:text-amber-300">Eduraq</Link>
        <LanguageSwitcher variant="dark" />
      </div>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 border border-[#E8E6DE]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <UserCircle2 className="w-7 h-7" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">Eduraq</h1>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            {t('تسجيل دخول الحساب', 'Account Sign In')}
          </p>
          {bookingSignIn && (
            <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center text-[11px] font-semibold leading-5 text-blue-800">
              {t('سجّل الدخول للمتابعة من الموعد الذي اخترته.', 'Sign in to continue with the time you selected.')}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {t('البريد الإلكتروني', 'Email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              {t('كلمة المرور', 'Password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {resetMessage && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {resetMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('تسجيل الدخول', 'Sign In')}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={resetting}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors disabled:opacity-60"
          >
            {resetting ? t('جاري الإرسال...', 'Sending...') : t('نسيت كلمة المرور؟', 'Forgot password?')}
          </button>

          <p className="text-center text-xs text-slate-500">
            {t('طالب جديد؟', 'New student?')}{' '}
            <Link
              href={redirectTarget ? `/account/signup?redirect=${encodeURIComponent(redirectTarget)}` : '/account/signup'}
              className="font-bold text-emerald-700 hover:underline"
            >
              {t('أنشئ حساباً مجانياً', 'Create a free account')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
