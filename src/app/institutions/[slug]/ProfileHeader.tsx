'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import { localeHref } from '@/lib/locale';
import { formatCurrency } from '@/lib/utils';
import { MapPin, ShieldCheck, Star, Calendar, Users, DollarSign, Sparkles } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from './Institution.i18n';

// The cover banner (name, badges, rating) and the quick-stats ribbon under it.
export default function ProfileHeader({
  institution,
  governorate,
  category,
}: {
  institution: Institution;
  governorate: Governorate | null;
  category: Category | null;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
    <>
      {/* Hero Cover Banner (Ported from Stitch Screen 3) */}
      <div className="relative h-72 sm:h-96 w-full bg-[#123D35] overflow-hidden">
        <Thumbnail
          src={institution.coverImageUrl}
          alt={pickLocalized(institution.name, language)}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
          fallbackClassName="absolute inset-0 bg-transparent"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#0B192C] via-[#0B192C]/40 to-transparent"></div>

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-between py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Link href={localeHref('/', language)} className="hover:text-white transition-colors">{t('home')}</Link>
            <span>/</span>
            <Link href={localeHref('/explore', language)} className="hover:text-white transition-colors">{t('directory')}</Link>
            <span>/</span>
            <span className="text-amber-300 font-bold">{pickLocalized(institution.name, language)}</span>
          </div>

          {/* Profile Header info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 pb-4">
            <Thumbnail
              src={institution.logoUrl}
              alt={pickLocalized(institution.name, language)}
              width={112}
              height={112}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-2xl bg-white shrink-0"
            />

            <div className="space-y-2 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-600 text-white">
                  {category ? pickLocalized(category.name, language) : institution.categoryId}
                </span>

                {/* Public badge reflects verification status only — the evidence-freshness flag is an
                    internal data-quality signal surfaced to the institution owner/admin, not visitors. */}
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md ${institution.isVerified ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/40' : 'text-amber-200 bg-amber-950/80 border border-amber-500/40'}`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${institution.isVerified ? 'text-emerald-400' : 'text-amber-400'}`} />
                   <span>
                     {institution.isVerified
                        ? pickLocalized(institution.verificationBadgeLabel, language)
                        : t('verificationPending')}
                   </span>
                </span>
              </div>

               <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                 {pickLocalized(institution.name, language)}
               </h1>

               <p className="max-w-2xl text-xs sm:text-sm text-slate-200 leading-relaxed">
                 {pickLocalized(institution.tagline, language)}
               </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{governorate ? pickLocalized(governorate.name, language) : institution.governorateId}</span>
                  <span>-</span>
                  {/* <bdi> isolates this run from the surrounding Arabic sentence's bidi context —
                      needed because the address may still be in English only (an institution that
                      hasn't supplied an Arabic translation yet) and mixed-direction text next to
                      the "-" separator otherwise gets visually reordered. */}
                  <bdi>{pickLocalized(institution.address, language) || institution.address.en || institution.address.ar}</bdi>
                </div>

                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-md text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{institution.metrics.ratingAvg}</span>
                  <span className="text-slate-400 font-normal">({t('reviewsCount', { n: institution.metrics.reviewCount })})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Ribbon Bar */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-start">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('established')}</span>
               <span className="font-extrabold text-xs text-slate-800">{institution.establishedYear || t('notProvided')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('genderPolicy')}</span>
              <span className="font-extrabold text-xs text-slate-800">
                {institution.genderPolicy === 'CO_ED' ? t('coEd') : t('singleGender')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('tuitionTier')}</span>
              <span className="font-extrabold text-xs text-slate-800">
                {institution.tuition.min === 0 ? (
                  t('fullyFree')
                ) : (
                  // The range is always low-then-high; without an explicit direction, the "-"
                  // between two number runs gets reordered by the surrounding RTL context in
                  // Arabic (rendering high-then-low instead).
                  <span dir="ltr">
                    {formatCurrency(institution.tuition.min, institution.tuition.currency, language)} - {formatCurrency(institution.tuition.max, institution.tuition.currency, language)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Only shown when the institution actually reported a rate. This used to fall back to a
              hardcoded 92%, which published an invented statistic for every institution that had
              never supplied one. */}
          {typeof institution.metrics.graduateEmploymentRate === 'number' && (
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('graduateRate')}</span>
                <span className="font-extrabold text-xs text-emerald-600 font-mono">
                  {institution.metrics.graduateEmploymentRate}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
