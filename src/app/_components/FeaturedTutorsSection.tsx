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
  const { language, t } = useLanguage();

  const getDeliveryModeLabel = (modes: Tutor['deliveryMode']) => {
    const hasOnline = modes?.includes('ONLINE');
    const hasInPerson = modes?.includes('IN_PERSON');
    const hasHybrid = modes?.includes('HYBRID');

    if (hasHybrid || (hasOnline && hasInPerson)) {
      return t('حضوري وعبر الإنترنت', 'In-Person & Online');
    }
    if (hasOnline) {
      return t('عبر الإنترنت', 'Online');
    }
    return t('حضوري', 'In-Person');
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
            {t('كوادر تعليمية وتدريس خصوصي', 'Tutors & Private Educators')}
          </div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B192C] sm:text-3xl">
            {t('نخبة أساتذة التدريس الخصوصي في العراق', 'Featured Private Tutors in Iraq')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {t(
              'احجز جلسات فردية أو جماعية مع أساتذة معتمدين، وتواصل معهم مباشرةً عبر واتساب.',
              'Book 1-on-1 or group sessions with vetted tutors, and connect directly via WhatsApp.'
            )}
          </p>
        </div>

        <Link
          href={localeHref('/tutors', language)}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-blue-700 transition-colors hover:text-blue-900 sm:self-auto"
        >
          <span>{t('استكشف جميع الأساتذة', 'Explore all tutors')}</span>
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
            const name = language === 'en' ? tutor.fullName.en : tutor.fullName.ar;
            const hasReviews = tutor.reviewCount > 0;

            const tutorSubject = tutor.subjectIds?.[0]
              ? subjects.find((s) => s.id === tutor.subjectIds[0])
              : null;
            const subjectLabel = tutorSubject
              ? (language === 'en' ? tutorSubject.name.en : tutorSubject.name.ar)
              : null;

            const gov = governorates.find((g) => g.id === tutor.governorateId);
            const govName = gov ? (language === 'en' ? gov.name.en : gov.name.ar) : null;
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
                      <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 group-hover:ring-[#0B192C]/20 transition-all">
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
                          <span>{hasReviews ? tutor.ratingAvg.toFixed(1) : t('جديد', 'New')}</span>
                          {hasReviews && (
                            <span className="text-[11px] font-normal text-slate-400">
                              ({tutor.reviewCount})
                            </span>
                          )}
                        </div>

                        {tutor.yearsOfExperience > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            <Award className="h-3 w-3 text-amber-600" aria-hidden="true" />
                            <span>{t(`خبرة ${tutor.yearsOfExperience} سنة`, `${tutor.yearsOfExperience}y exp`)}</span>
                          </span>
                        )}
                      </div>

                      <Link href={profileHref} className="block mt-1.5">
                        <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-blue-700">
                          {name}
                        </h3>
                      </Link>

                      <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-500">
                        {language === 'en' ? tutor.title.en : tutor.title.ar}
                      </p>
                    </div>
                  </div>

                  {/* Taxonomy & Location Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {subjectLabel && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                        <BookOpen className="h-3 w-3 text-blue-600 shrink-0" aria-hidden="true" />
                        <span className="truncate max-w-[130px]">{subjectLabel}</span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      <MapPin className="h-3 w-3 text-slate-500 shrink-0" aria-hidden="true" />
                      <span>{govName || t('العراق', 'Iraq')}</span>
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
                        {language === 'en'
                          ? tutor.verificationBadgeLabel?.en || 'Verified Instructor'
                          : tutor.verificationBadgeLabel?.ar || 'أستاذ وزاري معتمد وموثّق'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom: Hourly Rate & Actions */}
                <div className="mt-5 border-t border-slate-100 pt-3">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <div>
                      <span className="text-base font-extrabold text-[#0B192C]">
                        {formatCurrencyIQD(tutor.hourlyRate.iqd, language)}
                      </span>
                      <span className="mx-1 text-[11px] font-medium text-slate-500">
                        / {t('ساعة', 'hr')}
                      </span>
                    </div>

                    {tutor.groupRate?.iqd > 0 && (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {t('متاح مجموعات', 'Group slots')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={profileHref}
                      className="flex-1 rounded-xl bg-[#0B192C] py-2.5 text-center text-xs font-extrabold text-white transition-all hover:bg-[#1E3E62] active:scale-[0.98]"
                    >
                      {t('احجز جلسة', 'Book session')}
                    </Link>
                    <a
                      href={`https://wa.me/${tutor.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t(
                        `تواصل عبر واتساب مع ${name}`,
                        `Contact ${name} on WhatsApp`
                      )}
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
            {t('لا يوجد أساتذة منشورون حالياً', 'No published tutors yet')}
          </h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">
            {t(
              'كن أول من ينضم إلى نخبة المعلمين المعتمدين في العراق واستقبل طلبات التدريس.',
              'Be the first to join our vetted educators directory and start receiving student bookings.'
            )}
          </p>
          <Link
            href="/apply"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B192C] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E3E62]"
          >
            <span>{t('تقديم طلب الانضمام كأستاذ', 'Apply to Join as a Tutor')}</span>
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Educator Recruitment Banner */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50/70 via-slate-50 to-amber-50/50 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5 text-center sm:text-start">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B192C] text-[#F1C40F] shadow-sm">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0B192C]">
              {t('هل أنت أستاذ أو معلم خصوصي في العراق؟', 'Are you a private tutor or teacher in Iraq?')}
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              {t(
                'انضم إلى دليل مدرسي المنصة المعتمدين واستقبل طلبات الحجز المباشرة من آلاف الطلبة وأولياء الأمور.',
                'Join our vetted tutors directory and start receiving direct booking requests from students across Iraq.'
              )}
            </p>
          </div>
        </div>

        <Link
          href="/apply"
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#F1C40F] px-5 py-2.5 text-xs font-extrabold text-[#0B192C] shadow-sm transition-all hover:bg-[#D4AC0D] active:scale-95"
        >
          <span>{t('انضم كأستاذ معتمد', 'Apply as a Tutor')}</span>
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
