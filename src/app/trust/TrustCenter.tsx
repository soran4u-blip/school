'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { CheckCircle2, Clock3, FileCheck2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { localeHref } from '@/lib/locale';
import { useT } from '@/lib/useT';
import { TRUST_COPY } from './TrustCenter.i18n';

export default function TrustCenter() {
  const { language } = useLanguage();
  const t = useT(TRUST_COPY);
  const levels = [
    { icon: ShieldCheck, title: t('verifiedTitle'), body: t('verifiedBody'), tone: 'emerald' },
    { icon: Clock3, title: t('staleTitle'), body: t('staleBody'), tone: 'amber' },
    { icon: TriangleAlert, title: t('unverifiedTitle'), body: t('unverifiedBody'), tone: 'slate' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <header className="bg-[#0B192C] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="text-xs font-bold text-amber-300">{t('crumb')}</div>
          <h1 className="text-3xl font-black sm:text-5xl">{t('heading')}</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300">{t('intro')}</p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          {levels.map(({ icon: Icon, title, body, tone }) => (
            <article key={title} className={`rounded-2xl border p-6 ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50/70' : tone === 'amber' ? 'border-amber-200 bg-amber-50/70' : 'border-slate-200 bg-white'}`}>
              <Icon className={`mb-4 h-7 w-7 ${tone === 'emerald' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-500'}`} />
              <h2 className="font-extrabold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#0B192C]"><FileCheck2 className="h-5 w-5 text-blue-600" />{t('reviewHeading')}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[t('reviewAuthority'), t('reviewDates'), t('reviewContact'), t('reviewClarity')].map((item) => <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <h2 className="font-extrabold text-amber-950">{t('noteHeading')}</h2>
          <p className="mt-2 text-sm leading-7 text-amber-900">{t('noteBody')}</p>
        </section>
        <Link href={localeHref('/explore', language)} className="inline-flex rounded-xl bg-[#0B192C] px-5 py-3 text-sm font-bold text-white hover:bg-[#1E3E62]">{t('explore')}</Link>
      </main>
      <Footer />
    </div>
  );
}
