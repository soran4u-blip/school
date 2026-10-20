'use client';

import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { JOBS_COPY } from '../Jobs.i18n';
import { localeHref } from '@/lib/locale';

export default function JobNotFound() {
  const { language } = useLanguage();
  const t = useT(JOBS_COPY);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs sm:p-12">
          <p className="text-5xl font-black text-[#0B192C]">404</p>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            {t('notFoundTitle')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t('notFoundBody')}
          </p>
          <Link
            href={localeHref('/jobs', language)}
            className="mt-6 inline-flex rounded-xl bg-[#0B192C] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1E3E62]"
          >
            {t('browseJobs')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
