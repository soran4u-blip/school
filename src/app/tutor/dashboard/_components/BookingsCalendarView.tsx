'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Booking } from '@/core/types/booking';
import { dayOfWeekFromDate, addDaysToDateString } from '@/lib/bookingLogic';
import { MessageThreads } from '@/lib/useMessageThreads';
import { formatDate } from '@/lib/utils';
import BookingCard from './BookingCard';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

// Sunday-start weekday labels — matches this app's existing dayOfWeek convention (0 = Sunday,
// same as dayOfWeekFromDate and the DAY_LABELS arrays already duplicated in
// TutorProfile.tsx/AvailabilityTab.tsx for the same reason: no shared constants module for this
// yet, so each file that needs it defines its own, consistent with that existing pattern.
const WEEKDAY_LABELS: { ar: string; en: string; ku: string }[] = [
  { ar: 'الأحد', en: 'Sun', ku: 'یەکشەممە' },
  { ar: 'الاثنين', en: 'Mon', ku: 'دووشەممە' },
  { ar: 'الثلاثاء', en: 'Tue', ku: 'سێشەممە' },
  { ar: 'الأربعاء', en: 'Wed', ku: 'چوارشەممە' },
  { ar: 'الخميس', en: 'Thu', ku: 'پێنجشەممە' },
  { ar: 'الجمعة', en: 'Fri', ku: 'هەینی' },
  { ar: 'السبت', en: 'Sat', ku: 'شەممە' },
];

interface SeriesInfo {
  index: number;
  total: number;
  lastDate: string;
}

export default function BookingsCalendarView({
  bookings,
  filteredBookings,
  todayStr,
  handleBookingStatus,
  threads,
  isThreadUnread,
}: {
  bookings: Booking[];
  filteredBookings: Booking[];
  todayStr: string;
  handleBookingStatus: (booking: Booking, status: Booking['status']) => void;
  threads: MessageThreads;
  isThreadUnread: (bookingId: string) => boolean;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_DASHBOARD_COPY);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(
    () => addDaysToDateString(addDaysToDateString(todayStr, -dayOfWeekFromDate(todayStr)), weekOffset * 7),
    [todayStr, weekOffset]
  );
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysToDateString(weekStart, i)), [weekStart]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filteredBookings) {
      if (!map.has(b.date)) map.set(b.date, []);
      map.get(b.date)!.push(b);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredBookings]);

  // Full recurring series per group, from the unfiltered booking list — so "session 4 of 12"
  // stays accurate even if the active status filter hides some of that series' instances.
  const seriesByGroupId = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (!b.recurringGroupId) continue;
      if (!map.has(b.recurringGroupId)) map.set(b.recurringGroupId, []);
      map.get(b.recurringGroupId)!.push(b);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
  }, [bookings]);

  const seriesInfoFor = (booking: Booking): SeriesInfo | null => {
    if (!booking.recurringGroupId) return null;
    const series = seriesByGroupId.get(booking.recurringGroupId);
    if (!series || series.length < 2) return null;
    const index = series.findIndex((b) => b.id === booking.id) + 1;
    return { index, total: series.length, lastDate: series[series.length - 1].date };
  };

  const seriesLabel = (info: SeriesInfo) =>
    t('seriesLabel', { index: info.index, total: info.total, last: info.lastDate });

  const formatDayHeader = (dateStr: string) => {
    const dow = dayOfWeekFromDate(dateStr);
    const fullDate = formatDate(dateStr, language, { weekday: undefined, month: 'long', year: 'numeric' });
    return { weekday: pickLocalized(WEEKDAY_LABELS[dow], language), fullDate };
  };

  const formatWeekRange = () => {
    const fmt = (d: string) => formatDate(d, language, { weekday: undefined });
    return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  };

  const weekTotal = weekDates.reduce((sum, d) => sum + (bookingsByDate.get(d)?.length || 0), 0);
  const agendaDates = weekDates.filter((date) => (bookingsByDate.get(date)?.length || 0) > 0);

  return (
    <div className="space-y-3">
      {/* Week Navigation Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title={t('prevWeek')}
          >
            {language !== 'en' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="font-bold text-sm text-slate-900 min-w-[9rem] text-center">{formatWeekRange()}</span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title={t('nextWeek')}
          >
            {language !== 'en' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {t('thisWeek')}
          </button>
        )}
      </div>

      {/* Agenda: dates are a reading order, rather than cramped calendar columns. */}
      <div className="space-y-4">
        {agendaDates.map((date) => {
          const { weekday, fullDate } = formatDayHeader(date);
          const isToday = date === todayStr;
          const dayBookings = bookingsByDate.get(date) || [];
          const isTomorrow = date === addDaysToDateString(todayStr, 1);
          const hasPending = dayBookings.some((booking) => booking.status === 'PENDING');

          return (
            <section key={date} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div
                className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${
                  isToday
                    ? 'bg-[#0B192C] text-white border-[#0B192C]'
                    : hasPending
                    ? 'bg-amber-50/70 border-amber-100 text-slate-900'
                    : 'bg-slate-50/70 border-slate-100 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarDays className={`w-4 h-4 ${isToday ? 'text-white/75' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-extrabold text-sm">
                      {isToday ? t('today') : isTomorrow ? t('tomorrow') : weekday}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-white/75' : 'text-slate-500'}`}>{fullDate}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                  isToday ? 'bg-white/15 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {dayBookings.length} {dayBookings.length === 1 ? t('sessionOne') : t('sessionMany')}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {dayBookings.map((booking) => {
                  const info = seriesInfoFor(booking);
                  return (
                    <div key={booking.id} className="relative">
                      {info && (
                        <span className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5" title={seriesLabel(info)}>
                          <Repeat className="w-3 h-3" /> {info.index}/{info.total}
                        </span>
                      )}
                      <BookingCard
                        booking={booking}
                        handleBookingStatus={handleBookingStatus}
                        threads={threads}
                        isThreadUnread={isThreadUnread}
                        showDate={false}
                        showStudent
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {weekTotal === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs text-slate-400">{t('noSessionsWeek')}</p>
        </div>
      )}

    </div>
  );
}
