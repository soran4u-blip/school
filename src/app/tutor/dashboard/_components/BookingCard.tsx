'use client';

import React from 'react';
import { Users, User, MessageCircle, Check, ListChecks, UserX, X, Calendar, Clock, Phone } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Booking } from '@/core/types/booking';
import MessageThreadPanel from '@/components/shared/MessageThreadPanel';
import { MessageThreads } from '@/lib/useMessageThreads';

// One booking's full detail + actions (confirm/complete/no-show/cancel, message thread toggle) —
// shared by the By Student accordion and the By Date calendar's detail modal, so both stay in
// sync with a single implementation instead of two copies drifting apart.
//
// `showDate` is skipped where the caller already shows the date elsewhere (a date group header,
// a calendar day column); `showStudent` is turned on wherever there's otherwise no indication of
// whose session this is (the calendar view, which isn't grouped by student).
export default function BookingCard({
  booking,
  handleBookingStatus,
  threads,
  isThreadUnread,
  showDate = true,
  showStudent = false,
}: {
  booking: Booking;
  handleBookingStatus: (booking: Booking, status: Booking['status']) => void;
  threads: MessageThreads;
  isThreadUnread: (bookingId: string) => boolean;
  showDate?: boolean;
  showStudent?: boolean;
}) {
  const { t, language } = useLanguage();
  const formattedDate = new Intl.DateTimeFormat(language === 'ar' ? 'ar-IQ' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${booking.date}T12:00:00`));

  return (
    <div className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {booking.type === 'GROUP' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                <Users className="w-3 h-3" />
                {t(`مجموعة (${booking.participants.length}/${booking.maxGroupSize})`, `Group (${booking.participants.length}/${booking.maxGroupSize})`)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                <User className="w-3 h-3" />
                {t('فردي', '1-on-1')}
              </span>
            )}

            {showDate && (
              <span className="font-bold text-sm text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formattedDate}
              </span>
            )}

            <span className={`text-xs text-slate-600 font-mono flex items-center gap-1 ${!showDate ? 'font-bold text-sm text-slate-900' : ''}`}>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {booking.startTime}–{booking.endTime}
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : booking.status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : booking.status === 'CANCELLED' || booking.status === 'NO_SHOW'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse'
              }`}
            >
              {booking.status === 'PENDING' ? t('قيد الانتظار', 'Pending') :
               booking.status === 'CONFIRMED' ? t('مؤكد', 'Confirmed') :
               booking.status === 'COMPLETED' ? t('مكتمل', 'Completed') :
               booking.status === 'CANCELLED' ? t('ملغي', 'Cancelled') :
               booking.status === 'NO_SHOW' ? t('لم يحضر', 'No Show') : booking.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-bold font-mono text-slate-800">
              {booking.pricePerStudent.iqd.toLocaleString()} IQD
            </span>
            {booking.participants?.length > 0 && (showStudent || booking.participants.length > 1) && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-[11px]">
                {booking.participants.map((p, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => threads.toggle(booking.id)}
            className={`relative p-2 rounded-lg transition-colors ${
              threads.expandedId === booking.id
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
            title={t('مراسلة بخصوص هذا الموعد', 'Message about this session')}
          >
            <MessageCircle className="w-4 h-4" />
            {isThreadUnread(booking.id) && (
              <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </button>

          {booking.status === 'PENDING' && (
            <button
              onClick={() => handleBookingStatus(booking, 'CONFIRMED')}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
              title={t('تأكيد هذا الموعد', 'Confirm this session')}
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {booking.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => handleBookingStatus(booking, 'COMPLETED')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                title={t('اكتملت الجلسة', 'Mark Completed')}
              >
                <ListChecks className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBookingStatus(booking, 'NO_SHOW')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title={t('لم يحضر الطالب', 'Mark No-show')}
              >
                <UserX className="w-4 h-4" />
              </button>
            </>
          )}

          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button
              onClick={() => {
                if (
                  booking.status === 'CONFIRMED' &&
                  !confirm(
                    t(
                      'هذا الحجز مؤكد بالفعل. هل تريد إلغاءه فعلاً؟',
                      'This booking is already confirmed. Cancel it anyway?'
                    )
                  )
                ) {
                  return;
                }
                handleBookingStatus(booking, 'CANCELLED');
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
              title={t('إلغاء الموعد', 'Cancel Session')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {threads.expandedId === booking.id && (
        <div className="pt-2 border-t border-slate-200">
          <MessageThreadPanel threadId={booking.id} threads={threads} ownRole="tutor" />
        </div>
      )}
    </div>
  );
}
