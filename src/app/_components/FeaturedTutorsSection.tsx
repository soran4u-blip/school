'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Tutor } from '@/core/types/tutor';
import { formatCurrencyIQD } from '@/lib/utils';
import { ArrowRight, CalendarDays, MessageSquare, ShieldCheck, Star } from 'lucide-react';

function deliveryLabel(mode: Tutor['deliveryMode'][number], t: (ar: string, en: string) => string) {
  if (mode === 'ONLINE') return t('عبر الإنترنت', 'Online');
  if (mode === 'IN_PERSON') return t('حضوري', 'In person');
  return t('مرن', 'Hybrid');
}

// Tutor cards mirror the calmer listing language above: the person, qualifications, rate, and
// booking route are easy to scan without removing the existing WhatsApp contact path.
export default function FeaturedTutorsSection({ featuredTutors }: { featuredTutors: Tutor[] }) {
  const { language, t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
            {t('نخبة الكوادر التعليمية', 'Top certified mentors')}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0B192C] sm:text-3xl">
            {t('أساتذة خصوصيون موثوقون لخطوتك القادمة', 'Trusted tutors for your next learning step')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {t('تواصل مباشرةً مع مدرسين معتمدين، واطّلع على خبراتهم وخيارات الحجز.', 'Connect directly with verified tutors, then review their experience and booking options.')}
          </p>
        </div>

        <Link
          href={localeHref('/tutors', language)}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-blue-700 transition-colors hover:text-blue-900 sm:self-auto"
        >
          <span>{t('استكشف جميع الأساتذة', 'Explore all tutors')}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {featuredTutors.map((tutor) => {
          const profileHref = localeHref(`/tutors/${tutor.slug || tutor.id}`, language);
          const primaryMode = tutor.deliveryMode[0];

          return (
            <article
              key={tutor.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_35px_-24px_rgba(15,23,42,0.68)] sm:p-6"
            >
              <div className="absolute -top-16 -end-12 h-40 w-40 rounded-full bg-emerald-50/80 blur-3xl transition-opacity group-hover:opacity-80" />
              <div className="relative flex gap-4 sm:gap-5">
                <Link href={profileHref} className="shrink-0 self-start">
                  <Thumbnail
                    src={tutor.photoUrl}
                    alt={language === 'en' ? tutor.fullName.en : tutor.fullName.ar}
                    width={88}
                    height={88}
                    className="h-[4.5rem] w-[4.5rem] rounded-2xl border-2 border-white object-cover shadow-md ring-1 ring-slate-200 sm:h-[5.5rem] sm:w-[5.5rem]"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={profileHref} className="block">
                        <h3 className="truncate text-base font-extrabold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-lg">
                          {language === 'en' ? tutor.fullName.en : tutor.fullName.ar}
                        </h3>
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs font-bold text-blue-700">
                        {language === 'en' ? tutor.title.en : tutor.title.ar}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-extrabold text-amber-800">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                      {tutor.ratingAvg}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {tutor.isVerified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-800">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                        {language === 'en' ? tutor.verificationBadgeLabel.en : tutor.verificationBadgeLabel.ar}
                      </span>
                    )}
                    {primaryMode && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600">
                        {deliveryLabel(primaryMode, t)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="relative mt-4 min-h-10 text-xs leading-5 text-slate-600 line-clamp-2">
                {language === 'en' ? tutor.bio.en : tutor.bio.ar}
              </p>

              <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400">{t('سعر الساعة', 'Hourly rate')}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">{formatCurrencyIQD(tutor.hourlyRate.iqd, language)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {tutor.yearsOfExperience} {t('سنوات خبرة', 'years experience')}
                </div>
              </div>

              <div className="relative mt-4 flex items-center gap-2">
                <Link
                  href={profileHref}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B192C] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#1E3E62]"
                >
                  {t('احجز موعداً', 'Book a session')}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                </Link>
                <a
                  href={`https://wa.me/${tutor.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t(`تواصل عبر واتساب مع ${tutor.fullName.ar}`, `Contact ${tutor.fullName.en} on WhatsApp`)}
                  className="flex h-[2.375rem] w-[2.375rem] shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
