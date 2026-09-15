'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { todayLocalDate } from '@/lib/utils';
import { Governorate } from '@/core/types/masterData';
import { EduEvent } from '@/core/types/event';
import { EVENT_TYPE_LABELS } from '@/lib/eventLabels';
import {
  CalendarDays,
  MapPin,
  SlidersHorizontal,
  X,
  RotateCcw,
  Building2,
  Globe,
} from 'lucide-react';

interface EventsListProps {
  events: EduEvent[];
  governorates: Governorate[];
}

function EventsContent({ events, governorates }: EventsListProps) {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();

  const [selectedGov, setSelectedGov] = useState(searchParams.get('governorate') || 'all');
  const [selectedType, setSelectedType] = useState<EduEvent['eventType'] | 'all'>('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const today = todayLocalDate();

  const filtered = events.filter((ev) => {
    if (ev.startDate < today) return false; // past events dropped from the public listing
    if (selectedGov !== 'all' && ev.governorateId !== selectedGov) return false;
    if (selectedType !== 'all' && ev.eventType !== selectedType) return false;
    if (onlineOnly && !ev.isOnline) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const clearFilters = () => {
    setSelectedGov('all');
    setSelectedType('all');
    setOnlineOnly(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="bg-[#0B192C] text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <span>{t('دليل العراق التعليمي', 'Eduraq Directory')}</span>
            <span>/</span>
            <span>{t('الفعاليات', 'Events')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black">
            {t('فعاليات تعليمية في العراق', 'Education Events Across Iraq')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal">
            {t(
              'أيام مفتوحة، معارض، وورش عمل ينظمها المؤسسات التعليمية والمنظمات المعتمدة على المنصة.',
              'Open houses, exhibitions, and workshops hosted by verified institutions and NGOs on the platform.'
            )}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 text-xs font-extrabold text-[#0B192C]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('تصفية النتائج والفلاتر', 'Filter Results')}</span>
          </button>
          <span className="text-xs text-slate-500 font-bold">{sorted.length} {t('فعالية', 'events')}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className={`lg:col-span-4 space-y-6 ${mobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'}`}>
            {mobileFilterOpen && (
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">{t('فلاتر البحث', 'Filters')}</h3>
                <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-700" />
                  <span className="font-extrabold text-sm text-[#0B192C]">{t('تصفية حسب', 'Filter By')}</span>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('إعادة ضبط', 'Reset')}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('المحافظة', 'Governorate')}</label>
                <select
                  value={selectedGov}
                  onChange={(e) => setSelectedGov(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                >
                  <option value="all">{t('كافة المحافظات', 'All Governorates')}</option>
                  {governorates.map((gov) => (
                    <option key={gov.id} value={gov.id}>
                      {language === 'en' ? gov.name.en : gov.name.ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">{t('نوع الفعالية', 'Event Type')}</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as EduEvent['eventType'] | 'all')}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
                >
                  <option value="all">{t('كافة الأنواع', 'All Types')}</option>
                  {(Object.keys(EVENT_TYPE_LABELS) as EduEvent['eventType'][]).map((key) => (
                    <option key={key} value={key}>
                      {language === 'en' ? EVENT_TYPE_LABELS[key].en : EVENT_TYPE_LABELS[key].ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">{t('عبر الإنترنت فقط', 'Online Only')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={onlineOnly}
                    onChange={(e) => setOnlineOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>

              {mobileFilterOpen && (
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#0B192C] text-white rounded-xl text-xs font-bold mt-4"
                >
                  {t('تطبيق الفلاتر', 'Apply Filters')}
                </button>
              )}
            </div>
          </aside>

          <main className="lg:col-span-8 space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-700">
                {t('تم العثور على', 'Found')}{' '}
                <span className="text-blue-700 font-black text-sm">{sorted.length}</span>{' '}
                {t('فعالية قادمة', 'upcoming events')}
              </div>
            </div>

            {sorted.length > 0 ? (
              <div className="space-y-4">
                {sorted.map((ev) => {
                  const gov = governorates.find((g) => g.id === ev.governorateId);
                  return (
                    <Link
                      key={ev.id}
                      href={localeHref(`/events/${ev.slug || ev.id}`, language)}
                      className="block bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all p-5"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h2 className="font-extrabold text-base text-slate-900">
                            {language === 'en' ? ev.title.en : ev.title.ar}
                          </h2>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{ev.posterName || ev.institutionId || ev.employerId}</span>
                            {ev.employerId && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700">
                                {t('منظمة', 'NGO')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                          {language === 'en' ? EVENT_TYPE_LABELS[ev.eventType].en : EVENT_TYPE_LABELS[ev.eventType].ar}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-3">
                        {language === 'en' ? ev.description.en : ev.description.ar}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                          {ev.startDate}{ev.endDate && ev.endDate !== ev.startDate ? ` – ${ev.endDate}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ev.isOnline ? t('عبر الإنترنت', 'Online') : (gov ? (language === 'en' ? gov.name.en : gov.name.ar) : ev.governorateId)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
                <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-800">
                  {t('لا توجد فعاليات قادمة مطابقة', 'No Matching Upcoming Events')}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {t('جرّب تقليل الفلاتر أو العودة لاحقاً لمزيد من الفعاليات.', 'Try broadening your filters, or check back later for new events.')}
                </p>
                <button onClick={clearFilters} className="px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold">
                  {t('إعادة ضبط كافة الفلاتر', 'Reset All Filters')}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// The Suspense boundary is for useSearchParams (the ?governorate= deep link), not for data — the
// listing itself is server-rendered and arrives as props. See ./page.tsx.
export default function EventsList(props: EventsListProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-slate-600">Loading Events...</div>}>
      <EventsContent {...props} />
    </Suspense>
  );
}
