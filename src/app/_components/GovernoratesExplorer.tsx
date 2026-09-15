'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Governorate } from '@/core/types/masterData';

// A compact location directory between the campaign card and tutor showcase. Each tile keeps the
// full governorate route and live listing total, but is easier to scan as a set of destinations.
export default function GovernoratesExplorer({ governorates }: { governorates: Governorate[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-start lg:gap-12">
          <div className="lg:pt-1">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
              {t('تغطية وطنية شاملة', 'Nationwide coverage')}
            </p>
            <h2 className="mt-2 max-w-md text-2xl font-extrabold tracking-tight text-[#0B192C] sm:text-3xl">
              {t('ابحث بالقرب منك، في أي محافظة عراقية', 'Find the right place, closer to home')}
            </h2>
            <p className="mt-3 max-w-md text-xs leading-6 text-slate-500 sm:text-sm">
              {t('اختر محافظتك لتصفح المدارس والجامعات والمؤسسات التعليمية المتاحة فيها.', 'Choose a governorate to browse the schools, universities, and education providers available there.')}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-800">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {t(`${governorates.length} محافظة مغطاة`, `${governorates.length} governorates covered`)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {governorates.map((gov) => (
              <Link
                key={gov.id}
                href={`${localeHref('/explore', language)}?governorate=${gov.id}`}
                className="group flex min-h-24 flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_10px_18px_-18px_rgba(15,23,42,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_24px_-18px_rgba(15,23,42,0.58)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-1 text-xs font-extrabold text-slate-800 transition-colors group-hover:text-blue-700 sm:text-sm">
                    {language === 'en' ? gov.name.en : gov.name.ar}
                  </span>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1 font-mono text-[9px] font-bold text-slate-500 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                    {gov.code}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
                  <span>{gov.institutionsCount || 0} {t('مؤسسة', 'listings')}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
