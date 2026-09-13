'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat, X, MessageCircle } from 'lucide-react';
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

function statusChipClasses(status: Booking['status']): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100';
    case 'COMPLETED':
      return 'bg-blue-50 border-blue-400 text-blue-800 hover:bg-blue-100';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'bg-rose-50 border-rose-400 text-rose-700 hover:bg-rose-100 opacity-70';
    default:
      return 'bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100';
  }
}

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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

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
    const dayNum = Number(dateStr.slice(8, 10));
    return { weekday: language === 'ar' ? WEEKDAY_LABELS[dow].ar : WEEKDAY_LABELS[dow].en, dayNum };
  };

  const formatWeekRange = () => {
    const fmt = (d: string) =>
      new Date(`${d}T12:00:00`).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekDates[0])} – ${fmt(weekDates[6])}`;
  };

  const weekTotal = weekDates.reduce((sum, d) => sum + (bookingsByDate.get(d)?.length || 0), 0);

  const selectedBooking = selectedBookingId ? bookings.find((b) => b.id === selectedBookingId) || null : null;

  useEffect(() => {
    if (!selectedBookingId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBookingId(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selectedBookingId]);

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

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDates.map((date) => {
          const { weekday, dayNum } = formatDayHeader(date);
          const isToday = date === todayStr;
          const dayBookings = bookingsByDate.get(date) || [];

          return (
            <div
              key={date}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col ${
                isToday ? 'border-[#0B192C]/40 ring-1 ring-[#0B192C]/10' : 'border-slate-200'
              }`}
            >
              <div
                className={`px-3 py-2 flex md:flex-col items-center md:items-stretch justify-between md:justify-center gap-2 md:gap-0.5 border-b border-slate-100 ${
                  isToday ? 'bg-[#0B192C] text-white' : 'bg-slate-50/70 text-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold uppercase tracking-wide md:text-center">{weekday}</span>
                <span className="text-sm font-extrabold md:text-center">{dayNum}</span>
              </div>

              <div className="p-2 space-y-1.5 flex-1 min-h-[3rem]">
                {dayBookings.length === 0 ? (
                  <div className="text-center text-[11px] text-slate-300 py-3 md:py-6">—</div>
                ) : (
                  dayBookings.map((booking) => {
                    const info = seriesInfoFor(booking);
                    return (
                      <button
                        key={booking.id}
                        onClick={() => setSelectedBookingId(booking.id)}
                        className={`w-full text-start p-2 rounded-lg border-s-4 text-[11px] transition-colors ${statusChipClasses(booking.status)}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold">{booking.startTime}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {info && (
                              <span title={seriesLabel(info)}>
                                <Repeat className="w-3 h-3 opacity-70" />
                              </span>
                            )}
                            {isThreadUnread(booking.id) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="truncate font-medium">
                          {booking.participants?.map((p) => p.name).join(', ') || t('غير محدد', 'Unassigned')}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {weekTotal === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <p className="text-xs text-slate-400">{t('لا توجد حجوزات هذا الأسبوع', 'No sessions this week')}</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedBookingId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-slate-400" />
                {t('تفاصيل الموعد', 'Session Details')}
              </h3>
              <button
                onClick={() => setSelectedBookingId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {seriesInfoFor(selectedBooking) && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200/60 text-xs text-blue-800">
                  <Repeat className="w-3.5 h-3.5 shrink-0" />
                  <span>{seriesLabel(seriesInfoFor(selectedBooking)!)}</span>
                </div>
              )}
              <BookingCard
                booking={selectedBooking}
                handleBookingStatus={handleBookingStatus}
                threads={threads}
                isThreadUnread={isThreadUnread}
                showDate
                showStudent
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
