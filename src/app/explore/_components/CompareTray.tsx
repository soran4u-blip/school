'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { SupportedLanguage } from '@/core/types/masterData';
import { Check, ChevronDown, GitCompareArrows, X } from 'lucide-react';

function tuitionLabel(institution: Institution, language: SupportedLanguage, t: (ar: string, en: string) => string) {
  if (institution.tuition.min === 0) return t('مجاني', 'Free');
  const symbol = institution.tuition.currency === 'USD' ? '$' : 'د.ع';
  const min = institution.tuition.min.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US');
  const max = institution.tuition.max.toLocaleString(language === 'ar' ? 'ar-IQ' : 'en-US');
  return `${symbol}${min}${institution.tuition.max > institution.tuition.min ? ` - ${symbol}${max}` : ''}`;
}

export default function CompareTray({
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0B192C] text-white shadow-[0_-14px_50px_-20px_rgba(11,25,44,0.8)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-2 text-start"
            aria-expanded={expanded}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1C40F] text-[#0B192C]">
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-extrabold">{t('مقارنة المؤسسات', 'Compare institutions')}</span>
              <span className="block text-[11px] text-slate-300">{institutions.length}/3 {t('مضافة', 'selected')}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-slate-300 underline-offset-4 hover:text-white hover:underline"
          >
            {t('مسح المقارنة', 'Clear')}
          </button>
        </div>

        {expanded && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 sm:px-5">
            <div className="grid gap-2 sm:grid-cols-3">
              {institutions.map((institution) => (
                <div key={institution.id} className="relative rounded-xl border border-white/10 bg-white/8 p-3">
                  <button
                    type="button"
                    onClick={() => onRemove(institution.id)}
                    className="absolute end-2 top-2 rounded-full p-1 text-slate-300 hover:bg-white/10 hover:text-white"
                    aria-label={t(`إزالة ${institution.name.ar} من المقارنة`, `Remove ${institution.name.en} from comparison`)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <div className="pe-5 text-xs font-extrabold leading-5">
                    {language === 'en' ? institution.name.en : institution.name.ar}
                  </div>
                  <div className="mt-2 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between gap-2">
                      <span>{t('القسط', 'Tuition')}</span>
                      <span className="font-bold text-white">{tuitionLabel(institution, language, t)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>{t('التقييم', 'Rating')}</span>
                      <span className="font-bold text-white">
                        {institution.metrics.reviewCount > 0 ? `${institution.metrics.ratingAvg.toFixed(1)} (${institution.metrics.reviewCount})` : t('لا توجد تقييمات', 'No reviews')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>{t('موثق', 'Verified')}</span>
                      <Check className={`h-3.5 w-3.5 ${institution.isVerified ? 'text-emerald-300' : 'text-slate-500'}`} aria-label={institution.isVerified ? t('نعم', 'Yes') : t('لا', 'No')} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-300">
              {t('قارن المعلومات الأساسية قبل فتح التفاصيل والتواصل مع المؤسسة.', 'Compare the essentials before opening a profile or contacting a school.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
