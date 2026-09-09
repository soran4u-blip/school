'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { UserPlus, Loader2 } from 'lucide-react';
import { errorCode } from '@/lib/errors';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'Password must be at least 6 characters'));
      return;
    }

    setLoading(true);
    let created = false;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      created = true;
      const idToken = await credential.user.getIdToken();

      const signupRes = await fetch('/api/auth/student-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, fullName: fullName.trim(), phone: phone.trim() }),
      });
      const signupData = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok || !signupData.success) {
        throw new Error(signupData.error || 'Signup failed');
      }

      // Refresh the ID token so it carries the role/phone claims just set server-side.
      const freshIdToken = await credential.user.getIdToken(true);
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: freshIdToken }),
      });
      if (!sessionRes.ok) throw new Error('Session creation failed');

      const redirect = searchParams.get('redirect') || '/account';
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      if (created) {
        await signOut(auth).catch(() => {});
      }
      const code = errorCode(err) || '';
      if (code === 'auth/email-already-in-use') {
        setError(t('هذا البريد الإلكتروني مسجل بالفعل. سجّل الدخول بدلاً من ذلك.', 'This email is already registered. Try signing in instead.'));
      } else if (code === 'auth/weak-password') {
        setError(t('كلمة المرور ضعيفة جداً', 'Password is too weak'));
      } else {
        setError(t('تعذر إنشاء الحساب. حاول مرة أخرى.', 'Could not create your account. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B192C] px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">Eduraq</h1>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            {t('إنشاء حساب طالب', 'Create Student Account')}
          </p>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            {t('أنشئ حساباً لحجز الدروس ومتابعتها ومراسلة أساتذتك.', 'Create an account to book sessions, track them, and message your tutors.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('الاسم الكامل', 'Full Name')}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('رقم الهاتف', 'Phone Number')}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('نفس الرقم المستخدم عند الحجز', 'Same number used when booking')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('البريد الإلكتروني', 'Email')}</label>
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
            <label className="block text-xs font-bold text-slate-600 mb-1.5">{t('كلمة المرور', 'Password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t('إنشاء الحساب', 'Create Account')}
          </button>

          <p className="text-center text-xs text-slate-500">
            {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
            <Link href="/login" className="font-bold text-emerald-700 hover:underline">
              {t('تسجيل الدخول', 'Sign in')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function StudentSignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
