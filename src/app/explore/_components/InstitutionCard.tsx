'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Category, Governorate } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { GitCompareArrows, MapPin, MessageSquare, ShieldCheck, Star } from 'lucide-react';

export default function InstitutionCard({
  institution,
  governorate,
  category,
  compareSelected,
  compareDisabled,
  onCompare,
}: {
  institution: Institution;
  governorate: Governorate | undefined;
  category: Category | undefined;
  compareSelected: boolean;
  compareDisabled: boolean;
  onCompare: () => void;
}) {
  const { language, t } = useLanguage();
  const hasReviews = institution.metrics.reviewCount > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col md:flex-row group">
      <div className="md:w-64 h-48 md:h-auto relative bg-slate-100 shrink-0 overflow-hidden">
        <Thumbnail
          src={institution.coverImageUrl}
          alt={institution.name.en}
          fill
          sizes="(max-width: 768px) 100vw, 256px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackClassName="absolute inset-0"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent md:hidden" />
        <div className="absolute top-3 start-3">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#0B192C]/90 text-white backdrop-blur-xs">
            {category ? (language === 'en' ? category.name.en : category.name.ar) : institution.categoryId}
          </span>
        </div>
        <div className="absolute bottom-3 start-3">
          <Thumbnail src={institution.logoUrl} alt={institution.name.en} width={48} height={48} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md bg-white" />
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={localeHref(`/institutions/${institution.slug}`, language)}>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 hover:text-blue-700 transition-colors">
                  {language === 'en' ? institution.name.en : institution.name.ar}
                </h2>
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : institution.governorateId}</span>
                <span>•</span>
                <span>{language === 'en' ? institution.address.en : institution.address.ar}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md text-xs font-bold text-amber-900 border border-amber-200">
              <Star className={`w-3.5 h-3.5 ${hasReviews ? 'text-amber-500 fill-amber-500' : 'text-amber-300'}`} />
              <span>{hasReviews ? institution.metrics.ratingAvg.toFixed(1) : t('لا توجد تقييمات', 'No reviews')}</span>
              {hasReviews && <span className="text-slate-400 font-normal text-[11px]">({institution.metrics.reviewCount})</span>}
            </div>
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {language === 'en' ? institution.description.en : institution.description.ar}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {institution.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? institution.verificationBadgeLabel.en : institution.verificationBadgeLabel.ar}</span>
              </span>
            )}
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {institution.tuition.min === 0 ? t('مجاني 100%', '100% Free') : `$${institution.tuition.min.toLocaleString()} / ${t('سنوياً', 'yr')}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onCompare}
              disabled={compareDisabled}
              aria-pressed={compareSelected}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${compareSelected ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <GitCompareArrows className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{compareSelected ? t('تمت الإضافة', 'Added') : t('قارن', 'Compare')}</span>
            </button>
            <a
              href={`https://wa.me/${institution.contact.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t('واتساب', 'WhatsApp')}</span>
            </a>
            <Link
              href={localeHref(`/institutions/${institution.slug}`, language)}
              className="px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {t('التفاصيل والقبول', 'View Profile')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
