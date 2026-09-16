'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { Bookmark, ChevronDown, X } from 'lucide-react';

export default function ShortlistTray({
  institutions,
  onRemove,
  onClear,
}: {
  institutions: Institution[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (institutions.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 px-3 sm:bottom-20 sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-5xl overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 text-slate-900 shadow-[0_-14px_50px_-20px_rgba(11,25,44,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <button type="button" onClick={() => setExpanded((value) => !value)} className="flex items-center gap-2 text-start" aria-expanded={expanded}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1C40F] text-[#0B192C]"><Bookmark className="h-4 w-4" fill="currentColor" aria-hidden="true" /></span>
            <span>
              <span className="block text-xs font-extrabold">{t('قائمتي المختصرة', 'My shortlist')}</span>
              <span className="block text-[11px] text-slate-600">{institutions.length} {t('مؤسسة محفوظة', 'saved listings')}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          <button type="button" onClick={onClear} className="text-[11px] font-bold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">{t('مسح القائمة', 'Clear')}</button>
        </div>
        {expanded && (
          <div className="border-t border-amber-200 px-4 pb-4 pt-3 sm:px-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {institutions.map((institution) => (
                <div key={institution.id} className="relative rounded-xl border border-amber-200 bg-white p-3">
                  <button type="button" onClick={() => onRemove(institution.id)} className="absolute end-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label={t(`إزالة ${institution.name.ar}`, `Remove ${institution.name.en}`)}><X className="h-3.5 w-3.5" aria-hidden="true" /></button>
                  <Link href={`/institutions/${institution.slug}`} className="block pe-5 text-xs font-extrabold leading-5 hover:text-blue-700">{language === 'en' ? institution.name.en : institution.name.ar}</Link>
                  <p className="mt-1 text-[11px] text-slate-500">{institution.tuition.min === 0 ? t('مجاني', 'Free') : `${institution.tuition.min.toLocaleString()} ${institution.tuition.currency}`}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-600">{t('القائمة محفوظة على هذا الجهاز لتسهيل العودة والمقارنة.', 'Your shortlist is saved on this device so you can return and compare later.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
