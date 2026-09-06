'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { auth } from '@/core/firebase/config';
import { signOut } from 'firebase/auth';
import { UserCircle2, LogOut, Home } from 'lucide-react';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(auth);
    router.push('/login');
  };

  // The signup page renders its own full-screen layout (like /login) — skip this chrome for it.
  if (pathname === '/account/signup') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-[#0B192C] text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm">Eduraq</span>
              <p className="text-[11px] text-emerald-300 font-semibold">{t('حسابي', 'My Account')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t('الموقع الرئيسي', 'Site')}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-xs font-bold text-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('تسجيل الخروج', 'Log Out')}</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
