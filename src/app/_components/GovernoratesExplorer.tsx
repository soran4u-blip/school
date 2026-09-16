'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, MapPin } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Governorate } from '@/core/types/masterData';

// A compact location directory between the campaign card and tutor showcase. Each tile keeps the
// full governorate route and live listing total, but is easier to scan as a set of destinations.
export default function GovernoratesExplorer({ governorates }: { governorates: Governorate[] }) {
  const { language, t } = useLanguage();
  const orderedGovernorates = governorates
    .map((governorate, index) => ({ governorate, index }))
    .sort((a, b) => (b.governorate.institutionsCount || 0) - (a.governorate.institutionsCount || 0) || a.index - b.index)
    .map(({ governorate }) => governorate);
  const availableGovernorates = orderedGovernorates.filter((governorate) => (governorate.institutionsCount || 0) > 0);
  const otherGovernorates = orderedGovernorates.filter((governorate) => (governorate.institutionsCount || 0) === 0);

  const renderGovernorate = (gov: Governorate, empty = false) => (
    <Link
      key={gov.id}
      href={`${localeHref('/explore', language)}?governorate=${gov.id}`}
      className={`group flex min-h-24 flex-col justify-between rounded-xl border p-3.5 shadow-[0_10px_18px_-18px_rgba(15,23,42,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_24px_-18px_rgba(15,23,42,0.58)] ${empty ? 'border-slate-200/80 bg-white/75' : 'border-slate-200 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`line-clamp-1 text-xs font-extrabold transition-colors group-hover:text-blue-700 sm:text-sm ${empty ? 'text-slate-600' : 'text-slate-800'}`}>
          {language === 'en' ? gov.name.en : gov.name.ar}
        </span>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1 font-mono text-[9px] font-bold text-slate-500 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          {gov.code}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-400">
        <span>{empty ? t('لا توجد مؤسسات بعد', 'No listings yet') : `${gov.institutionsCount || 0} ${t('مؤسسة', 'listings')}`}</span>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden="true" />
      </div>
    </Link>
  );

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
              {t(`${governorates.length} محافظة، ${availableGovernorates.length} متاحة الآن`, `${governorates.length} governorates, ${availableGovernorates.length} available now`)}
            </div>
          </div>

          <div className="space-y-4">
            {availableGovernorates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{availableGovernorates.map((gov) => renderGovernorate(gov))}</div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-xs font-semibold text-slate-500">
                {t('سيتم إضافة المؤسسات حسب المحافظة قريباً.', 'Listings will be added by governorate soon.')}
              </div>
            )}

            {otherGovernorates.length > 0 && (
              <details className="group rounded-xl border border-slate-200 bg-white/60 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-extrabold text-slate-700 [&::-webkit-details-marker]:hidden">
                  <span>{t(`محافظات أخرى (${otherGovernorates.length})`, `Other governorates (${otherGovernorates.length})`)}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  {t('هذه المحافظات جاهزة لاستقبال مؤسسات جديدة في الدليل.', 'These locations are ready for new institutions to join the directory.')}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">{otherGovernorates.map((gov) => renderGovernorate(gov, true))}</div>
              </details>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
