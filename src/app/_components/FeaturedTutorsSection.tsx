'use client';

import React from 'react';
import Link from 'next/link';
import Thumbnail from '@/components/shared/Thumbnail';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { Tutor } from '@/core/types/tutor';
import { formatCurrencyIQD } from '@/lib/utils';
import { ArrowRight, MessageSquare, ShieldCheck, Star, Video } from 'lucide-react';

// Photo-forward tutor cards: the photo carries rating/verification/delivery-mode as overlaid
// chips, so the text below stays to name, subject, rate, and the booking/WhatsApp actions.
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {featuredTutors.map((tutor) => {
          const profileHref = localeHref(`/tutors/${tutor.slug || tutor.id}`, language);
          const primaryMode = tutor.deliveryMode[0];
          const name = language === 'en' ? tutor.fullName.en : tutor.fullName.ar;

          return (
            <article
              key={tutor.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_26px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_35px_-24px_rgba(15,23,42,0.68)]"
            >
              <Link href={profileHref} className="relative block aspect-[4/5] overflow-hidden bg-slate-100">
                <Thumbnail
                  src={tutor.photoUrl}
                  alt={name}
                  width={400}
                  height={500}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute start-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-amber-800 backdrop-blur">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {tutor.ratingAvg}
                </span>
                {tutor.isVerified ? (
                  <span
                    className="absolute end-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                    aria-label={language === 'en' ? tutor.verificationBadgeLabel.en : tutor.verificationBadgeLabel.ar}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : primaryMode === 'ONLINE' ? (
                  <span className="absolute end-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#0B192C]/70 text-white backdrop-blur">
                    <Video className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                ) : null}
              </Link>

              <div className="p-4 sm:p-5">
                <Link href={profileHref} className="block">
                  <h3 className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-blue-700 sm:text-base">
                    {name}
                  </h3>
                </Link>
                <p className="mt-0.5 line-clamp-1 text-xs font-bold text-blue-700">
                  {language === 'en' ? tutor.title.en : tutor.title.ar}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400">{t('سعر الساعة', 'Hourly rate')}</p>
                    <p className="mt-0.5 text-sm font-extrabold text-slate-900">{formatCurrencyIQD(tutor.hourlyRate.iqd, language)}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-slate-500">
                    {tutor.yearsOfExperience} {t('سنوات خبرة', 'yrs exp')}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={profileHref}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#F1C40F] py-2.5 text-xs font-extrabold text-[#0B192C] transition-colors hover:bg-[#D4AC0D]"
                  >
                    {t('احجز', 'Book')}
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
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
