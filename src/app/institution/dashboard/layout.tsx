'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { auth } from '@/core/firebase/config';
import { signOut } from 'firebase/auth';
import { Building2, LogOut, Home, MessageCircle } from 'lucide-react';
import NotificationCenter from '@/components/shared/NotificationCenter';

export default function InstitutionDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-[#0B192C] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm">Eduraq</span>
              <p className="text-[11px] text-purple-300 font-semibold">{t('بوابة المؤسسة التعليمية', 'Institution Portal')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/messages"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors"
              title={t('الرسائل', 'Messages')}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('الرسائل', 'Messages')}</span>
            </Link>
            <div className="bg-white rounded-xl text-slate-800">
              <NotificationCenter />
            </div>
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
