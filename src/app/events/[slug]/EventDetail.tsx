'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { EVENTS_COPY } from '../Events.i18n';
import { localeHref } from '@/lib/locale';
import { todayLocalDate } from '@/lib/utils';
import { EduEvent } from '@/core/types/event';
import { Institution } from '@/core/types/institution';
import { Governorate } from '@/core/types/masterData';
import { EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import {
  MapPin,
  Building2,
  CalendarDays,
  Globe,
  ExternalLink,
  MessageCircleMore,
} from 'lucide-react';

// Unlike JobDetail, there's no in-app form here — registration is external-link/WhatsApp only,
// so this stays a simple presentational client component (kept client for useLanguage/localeHref
// parity with the rest of the site's detail pages).
export default function EventDetail({
  event,
  institution,
  governorate,
}: {
  event: EduEvent;
  institution: Institution | null;
  governorate: Governorate | null;
}) {
  const { language } = useLanguage();
  const t = useT(EVENTS_COPY);

  const eventEnded = event.endDate ? event.endDate < todayLocalDate() : event.startDate < todayLocalDate();
  const canRegister = event.status === 'ACTIVE' && !eventEnded;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {pickLocalized(event.title, language)}
                  </h1>
                  {institution ? (
                    <Link href={localeHref(`/institutions/${institution.slug}`, language)} className="flex items-center gap-1.5 text-sm text-blue-700 font-bold hover:underline mt-1">
                      <Building2 className="w-4 h-4" />
                      {pickLocalized(institution.name, language)}
                    </Link>
                  ) : event.posterName ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 font-bold mt-1">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {event.posterName}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700">
                        {t('ngo')}
                      </span>
                    </div>
                  ) : null}
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                  {pickLocalized(EVENT_TYPE_LABELS[event.eventType], language)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  {event.startDate}{event.endDate && event.endDate !== event.startDate ? ` – ${event.endDate}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  {event.isOnline ? <Globe className="w-3.5 h-3.5 text-slate-400" /> : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                  {event.isOnline
                    ? t('online')
                    : (event.venue && (pickLocalized(event.venue, language))) || (governorate ? (pickLocalized(governorate.name, language)) : event.governorateId)}
                </span>
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-sm text-slate-900 mb-1">{t('aboutEvent')}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {pickLocalized(event.description, language)}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 sticky top-24">
              <h3 className="font-extrabold text-sm text-slate-900">{t('registration')}</h3>

              {!canRegister ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                  {event.status !== 'ACTIVE'
                    ? t('unavailable')
                    : t('ended')}
                </div>
              ) : (
                <div className="space-y-2">
                  {event.registrationLink ? (
                    <a
                      href={event.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <span>{t('registerNow')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                  {event.whatsappNumber ? (
                    <a
                      href={`https://wa.me/${event.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      <MessageCircleMore className="w-3.5 h-3.5" />
                      <span>{t('whatsapp')}</span>
                    </a>
                  ) : null}
                  {!event.registrationLink && !event.whatsappNumber && (
                    <p className="text-xs text-slate-500">{t('noRegistration')}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
