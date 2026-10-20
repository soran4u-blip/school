'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Tutor } from '@/core/types/tutor';
import { TaxonomyItem, Governorate } from '@/core/types/masterData';
import { formatCurrencyIQD } from '@/lib/utils';
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Video,
} from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { HOME_COPY } from './Home.i18n';

interface FeaturedTutorsSectionProps {
  featuredTutors: Tutor[];
  subjects?: TaxonomyItem[];
  governorates?: Governorate[];
}

export default function FeaturedTutorsSection({
  featuredTutors,
  subjects = [],
  governorates = [],
}: FeaturedTutorsSectionProps) {
  const { language } = useLanguage();
  const t = useT(HOME_COPY);

  const getDeliveryModeLabel = (modes: Tutor['deliveryMode']) => {
    const hasOnline = modes?.includes('ONLINE');
    const hasInPerson = modes?.includes('IN_PERSON');
    const hasHybrid = modes?.includes('HYBRID');

    if (hasHybrid || (hasOnline && hasInPerson)) {
      return t('deliveryBoth');
    }
    if (hasOnline) {
      return t('online');
    }
    return t('deliveryInPerson');
  };

  const gridClass =
    featuredTutors.length === 1
      ? 'max-w-md'
      : featuredTutors.length === 2
        ? 'max-w-3xl sm:grid-cols-2'
        : featuredTutors.length === 3
          ? 'max-w-5xl sm:grid-cols-2 lg:grid-cols-3'
          : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section className="max-w-7xl mx-auto w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Section Header */}
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {t('tutorsEyebrow')}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#103B34] sm:text-3xl">
            {t('tutorsTitle')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {t('tutorsIntro')}
          </p>
        </div>

        <Link
          href={localeHref('/tutors', language)}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-[#17695A] transition-colors hover:text-[#0B594D] sm:self-auto"
        >
          <span>{t('tutorsAll')}</span>
          <ArrowRight
            className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Tutors Grid / Empty State */}
      {featuredTutors.length > 0 ? (
        <div className={`mx-auto grid grid-cols-1 gap-5 lg:gap-6 ${gridClass}`}>
          {featuredTutors.map((tutor) => {
            const profileHref = localeHref(`/tutors/${tutor.slug || tutor.id}`, language);
            const name = pickLocalized(tutor.fullName, language);
            const hasReviews = tutor.reviewCount > 0;

            const tutorSubject = tutor.subjectIds?.[0]
              ? subjects.find((s) => s.id === tutor.subjectIds[0])
              : null;
            const subjectLabel = tutorSubject
              ? pickLocalized(tutorSubject.name, language)
              : null;

            const gov = governorates.find((g) => g.id === tutor.governorateId);
            const govName = gov ? pickLocalized(gov.name, language) : null;
            const deliveryLabel = getDeliveryModeLabel(tutor.deliveryMode);

            return (
              <article
                key={tutor.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_35px_-18px_rgba(15,23,42,0.45)]"
              >
                <div>
                  {/* Top: Avatar, Rating & Years of Experience */}
                  <div className="flex items-start gap-3.5">
                    <Link href={profileHref} className="relative shrink-0 block">
                      <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 group-hover:ring-[#103B34]/20 transition-all">
                        <Thumbnail
                          src={tutor.photoUrl}
                          alt={name}
                          width={80}
                          height={80}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          objectPosition={
                            tutor.photoFocalPoint
                              ? `${tutor.photoFocalPoint.x}% ${tutor.photoFocalPoint.y}%`
                              : undefined
                          }
                        />
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                          <span>{hasReviews ? tutor.ratingAvg.toFixed(1) : t('newTutor')}</span>
                          {hasReviews && (
                            <span className="text-[11px] font-normal text-slate-400">
                              ({tutor.reviewCount})
                            </span>
                          )}
                        </div>

                        {tutor.yearsOfExperience > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            <Award className="h-3 w-3 text-amber-600" aria-hidden="true" />
                            <span>{t('yearsExp', { n: tutor.yearsOfExperience })}</span>
                          </span>
                        )}
                      </div>

                      <Link href={profileHref} className="block mt-1.5">
                        <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-[#17695A]">
                          {name}
                        </h3>
                      </Link>

                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
                        {pickLocalized(tutor.title, language)}
                      </p>
                    </div>
                  </div>

                  {/* Taxonomy & Location Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {subjectLabel && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#EEF5F0] px-2.5 py-1 text-[11px] font-bold text-[#155C4D]">
                        <BookOpen className="h-3 w-3 text-blue-600 shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[130px]">{subjectLabel}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>{govName || t('iraq')}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      <Video className="h-3 w-3 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>{deliveryLabel}</span>
                    </span>
                  </div>

                  {/* Verified Badge */}
                  {tutor.isVerified && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span className="truncate">
                        {pickLocalized(tutor.verificationBadgeLabel, language) || t('verifiedInstructor')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom: Hourly Rate & Actions */}
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-base font-extrabold text-[#103B34]">
                        {formatCurrencyIQD(tutor.hourlyRate.iqd, language)}
                      </span>
                      <span className="mx-1 text-[11px] font-medium text-slate-500">
                        / {t('perHour')}
                      </span>
                    </div>

                    {tutor.groupRate?.iqd > 0 && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {t('groupSlots')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={profileHref}
                      className="flex-1 rounded-xl bg-[#103B34] py-2.5 text-center text-xs font-extrabold text-white transition-all hover:bg-[#1E3E62] active:scale-[0.98]"
                    >
                      {t('bookSession')}
                    </Link>
                    <a
                      href={`https://wa.me/${tutor.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('contactTutorWhatsApp', { name })}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-95"
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
          <GraduationCap className="mx-auto mb-2 h-10 w-10 text-slate-400" aria-hidden="true" />
          <h3 className="text-base font-extrabold text-slate-900">
            {t('noTutors')}
          </h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            {t('noTutorsNote')}
          </p>
          <Link
            href="/apply"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#103B34] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E3E62]"
          >
            <span>{t('applyTutor')}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Educator Recruitment Banner */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#D5E3DC] bg-linear-to-r from-blue-50/70 via-slate-50 to-amber-50/50 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 text-center sm:text-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#103B34] text-[#F1C40F] shadow-sm">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#103B34]">
              {t('recruitTitle')}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {t('recruitBody')}
            </p>
          </div>
        </div>

        <Link
          href="/apply"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#F1C40F] px-5 py-2.5 text-xs font-extrabold text-[#103B34] shadow-sm transition-all hover:bg-[#D4AC0D] active:scale-95"
        >
          <span>{t('recruitCta')}</span>
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
