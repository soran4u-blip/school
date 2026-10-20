'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Governorate, Category } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { isInstitutionEvidenceFresh } from '@/lib/publishingGuardrails';
import { ArrowRight, MapPin, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { HOME_COPY } from './Home.i18n';

// The directory's first content showcase. Cards make the institution itself the focal point and
// keep the profile action dominant, while the secondary WhatsApp route remains available.
export default function FeaturedInstitutionsSection({
  featuredInstitutions,
  governorates,
  categories,
}: {
  featuredInstitutions: Institution[];
  governorates: Governorate[];
  categories: Category[];
}) {
  const { language } = useLanguage();
  const t = useT(HOME_COPY);
  const gridClass = featuredInstitutions.length === 1
    ? 'max-w-xl'
    : featuredInstitutions.length === 2
      ? 'max-w-4xl md:grid-cols-2'
      : 'md:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="max-w-7xl mx-auto w-full px-4 pt-14 pb-20 sm:px-6 sm:pt-16 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t('instEyebrow')}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#103B34] sm:text-3xl">
            {t('instTitle')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {t('instIntro')}
          </p>
        </div>

        <Link
          href={localeHref('/explore', language)}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-[#17695A] transition-colors hover:text-[#0B594D] sm:self-auto"
        >
          <span>{t('instAll')}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      {featuredInstitutions.length > 0 ? (
        <div className={`mx-auto grid grid-cols-1 gap-5 lg:gap-6 ${gridClass}`}>
          {featuredInstitutions.map((inst) => {
            const gov = governorates.find((item) => item.id === inst.governorateId);
            const cat = categories.find((item) => item.id === inst.categoryId);
            const profileHref = localeHref(`/institutions/${inst.slug}`, language);
            const instName = pickLocalized(inst.name, language);
            const hasReviews = inst.metrics.reviewCount > 0;
            const publiclyVerified = inst.isVerified && isInstitutionEvidenceFresh(inst);

            return (
              <article
                key={inst.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_26px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_35px_-24px_rgba(15,23,42,0.68)]"
              >
                <Link href={profileHref} className="relative block h-48 overflow-hidden bg-slate-100">
                  <Thumbnail
                    src={inst.coverImageUrl}
                    alt={pickLocalized(inst.name, language)}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    fallbackClassName="absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#071220]/70 via-[#071220]/5 to-transparent" />
                  <div className="absolute top-3 start-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-extrabold text-[#103B34] shadow-sm backdrop-blur-sm">
                    {cat ? pickLocalized(cat.name, language) : inst.categoryId}
                  </div>
                  <div className="absolute top-3 end-3 inline-flex items-center gap-1 rounded-full bg-[#103B34]/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    <Star
                      className={`h-3.5 w-3.5 ${hasReviews ? 'fill-[#F1C40F] text-[#F1C40F]' : 'text-white/70'}`}
                      aria-hidden="true"
                    />
                    {hasReviews ? inst.metrics.ratingAvg.toFixed(1) : t('noReviews')}
                  </div>
                  <div className="absolute bottom-3 start-4 end-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-white/85">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {gov ? pickLocalized(gov.name, language) : inst.governorateId}
                      </p>
                    </div>
                    <Thumbnail
                      src={inst.logoUrl}
                      alt=""
                      width={52}
                      height={52}
                      className="h-[3.25rem] w-[3.25rem] shrink-0 rounded-xl border-2 border-white bg-white object-cover shadow-md"
                    />
                  </div>
                </Link>

                <div className="p-5">
                  <Link href={profileHref} className="block">
                    <h3 className="line-clamp-1 text-base font-extrabold leading-snug text-slate-900 transition-colors group-hover:text-[#17695A]">
                      {pickLocalized(inst.name, language)}
                    </h3>
                  </Link>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-slate-600 line-clamp-2">
                    {pickLocalized(inst.tagline, language)}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <span className="inline-flex min-w-0 items-center gap-1 text-[10px] font-bold text-emerald-800">
                      {publiclyVerified ? <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" /> : null}
                      <span className="truncate">
                        {publiclyVerified
                          ? pickLocalized(inst.verificationBadgeLabel, language)
                          : t('listedOnPlatform')}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] font-extrabold text-slate-700">
                      {inst.tuition.min === 0 ? t('free') : `$${inst.tuition.min.toLocaleString()} / ${t('perYear')}`}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      href={profileHref}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#103B34] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1E3E62]"
                    >
                      {t('viewProfile')}
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                    <a
                      href={`https://wa.me/${inst.contact.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('contactInstWhatsApp', { name: instName })}
                      className="flex h-[2.375rem] w-[2.375rem] shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <h3 className="text-base font-extrabold text-slate-900">{t('noInstitutions')}</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">{t('noInstitutionsNote')}</p>
          <Link href={localeHref('/explore', language)} className="mt-4 inline-flex rounded-xl bg-[#103B34] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E3E62]">
            {t('openDirectory')}
          </Link>
        </div>
      )}
    </section>
  );
}
