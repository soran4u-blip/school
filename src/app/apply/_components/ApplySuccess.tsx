'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useT } from '@/lib/useT';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { APPLY_COPY } from '../Apply.i18n';

// Confirmation screen shown after an application is submitted.
export default function ApplySuccess({ submittedId }: { submittedId: string }) {
  const router = useRouter();
  const t = useT(APPLY_COPY);
  // {link} marks where the status-page link goes; word order differs per language.
  const [statusHintBefore, statusHintAfter] = t('statusHint').split('{link}');

  return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-extrabold text-xl text-[#0B192C]">
            {t('submittedTitle')}
          </h1>
          <p className="text-sm text-slate-600">
            {t('submittedBody')}
          </p>
          <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <div className="font-bold text-slate-600">{t('referenceNumber')}</div>
            <div className="font-mono text-slate-700 break-all">{submittedId}</div>
          </div>
          <p className="text-xs text-slate-500">
            {statusHintBefore}
            <Link href="/apply/status" className="font-bold text-emerald-700 hover:underline">
              {t('statusPage')}
            </Link>
            {statusHintAfter}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-sm font-bold transition-colors"
          >
            {t('backHome')}
          </button>
          </div>
        </main>
        <Footer />
      </div>
  );
}
