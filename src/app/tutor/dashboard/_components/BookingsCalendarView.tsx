'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, CalendarDays } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Booking } from '@/core/types/booking';
import { dayOfWeekFromDate, addDaysToDateString } from '@/lib/bookingLogic';
import { MessageThreads } from '@/lib/useMessageThreads';
import BookingCard from './BookingCard';

// Sunday-start weekday labels — matches this app's existing dayOfWeek convention (0 = Sunday,
// same as dayOfWeekFromDate and the DAY_LABELS arrays already duplicated in
// TutorProfile.tsx/AvailabilityTab.tsx for the same reason: no shared constants module for this
// yet, so each file that needs it defines its own, consistent with that existing pattern.
const WEEKDAY_LABELS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sun' },
  { ar: 'الاثنين', en: 'Mon' },
  { ar: 'الثلاثاء', en: 'Tue' },
  { ar: 'الأربعاء', en: 'Wed' },
  { ar: 'الخميس', en: 'Thu' },
  { ar: 'الجمعة', en: 'Fri' },
  { ar: 'السبت', en: 'Sat' },
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
  const { t, language } = useLanguage();
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
    t(
      `جزء من سلسلة أسبوعية — الجلسة ${info.index} من ${info.total}، تنتهي ${info.lastDate}`,
      `Weekly series — session ${info.index} of ${info.total}, ends ${info.lastDate}`
    );

  const formatDayHeader = (dateStr: string) => {
    const dow = dayOfWeekFromDate(dateStr);
    const fullDate = new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${dateStr}T12:00:00`));
    return { weekday: language === 'ar' ? WEEKDAY_LABELS[dow].ar : WEEKDAY_LABELS[dow].en, fullDate };
  };

  const formatWeekRange = () => {
    const fmt = (d: string) =>
      new Date(`${d}T12:00:00`).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' });
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
            title={t('الأسبوع السابق', 'Previous week')}
          >
            {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="font-bold text-sm text-slate-900 min-w-[9rem] text-center">{formatWeekRange()}</span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title={t('الأسبوع القادم', 'Next week')}
          >
            {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {t('هذا الأسبوع', 'This Week')}
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
                      {isToday ? t('اليوم', 'Today') : isTomorrow ? t('غداً', 'Tomorrow') : weekday}
                    </p>
                    <p className={`text-xs ${isToday ? 'text-white/75' : 'text-slate-500'}`}>{fullDate}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full w-fit ${
                  isToday ? 'bg-white/15 text-white' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  {dayBookings.length} {dayBookings.length === 1 ? t('موعد', 'session') : t('مواعيد', 'sessions')}
                </span>
              </div>
              <div className="p-3 space-y-2">
                {dayBookings.map((booking) => {
                  const info = seriesInfoFor(booking);
                  return (
                    <div key={booking.id} className="relative">
                      {info && (
                        <span className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-1.5 py-0.5" title={seriesLabel(info)}>
                          <Repeat className="w-3 h-3" /> {t(`${info.index}/${info.total}`, `${info.index}/${info.total}`)}
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
          <p className="text-xs text-slate-400">{t('لا توجد حجوزات هذا الأسبوع', 'No sessions this week')}</p>
        </div>
      )}

    </div>
  );
}
