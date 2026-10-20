'use client';

import Link from 'next/link';
import { EduEvent } from '@/core/types/event';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { CalendarDays, MapPin, Globe, ArrowRight } from 'lucide-react';
import { EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { HOME_COPY } from './Home.i18n';

// Homepage promo for upcoming events, styled consistent with the other refreshed homepage
// sections (navy/gold, pill badges, hover-lift cards). Unlike AdBannerSection this isn't
// CMS-driven or randomly rotated — it's the nearest 3 real, real ACTIVE events sorted by date,
// already filtered to upcoming-only by the caller (see HomeContent.tsx).
export default function UpcomingEventsSection({ events }: { events: EduEvent[] }) {
  const { language } = useLanguage();
  const t = useT(HOME_COPY);
  if (events.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#17695A]">
            {t('eventsEyebrow')}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#103B34] sm:text-3xl">
            {t('eventsTitle')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            {t('eventsIntro')}
          </p>
        </div>

        <Link
          href={localeHref('/events', language)}
          className="group inline-flex items-center gap-1.5 self-start text-xs font-bold text-[#17695A] transition-colors hover:text-[#0B594D] sm:self-auto"
        >
          <span>{t('eventsAll')}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={localeHref(`/events/${ev.slug || ev.id}`, language)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_26px_-24px_rgba(15,23,42,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_20px_35px_-24px_rgba(15,23,42,0.68)]"
          >
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EEF5F0] px-2.5 py-1 text-[10px] font-extrabold text-[#155C4D]">
              {pickLocalized(EVENT_TYPE_LABELS[ev.eventType], language)}
            </span>

            <h3 className="mt-3 line-clamp-2 text-sm font-extrabold text-slate-900 transition-colors group-hover:text-[#17695A]">
              {pickLocalized(ev.title, language)}
            </h3>

            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {pickLocalized(ev.description, language)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                {ev.startDate}
              </span>
              <span className="flex items-center gap-1">
                {ev.isOnline ? <Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                {ev.isOnline ? t('online') : (ev.posterName || t('inPerson'))}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
