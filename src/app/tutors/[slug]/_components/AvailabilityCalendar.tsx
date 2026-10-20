'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { Calendar, Users } from 'lucide-react';
import { intlLocale } from '@/lib/locales';
import type { DaySlot, SlotStatus } from '../slots';
import { useT } from '@/lib/useT';
import { TUTOR_PROFILE_COPY } from '../TutorProfile.i18n';

const DAY_KEYS = ['day0', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6'] as const;

// The next two weeks of the tutor's weekly availability, with live booked/full state per slot.
export default function AvailabilityCalendar({
  tutor,
  days,
  statusFor,
  openBooking,
}: {
  tutor: Tutor;
  days: { date: string; dayOfWeek: number }[];
  statusFor: (date: string, startTime: string) => SlotStatus | undefined;
  openBooking: (daySlot: DaySlot, mode: 'INDIVIDUAL' | 'GROUP', existingGroupId?: string) => void;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_PROFILE_COPY);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-emerald-600" />
        <h2 className="font-bold text-sm text-slate-900">{t('bookASession')}</h2>
      </div>

      {tutor.availability.length === 0 ? (
        <p className="text-xs text-slate-400">{t('noAvailability')}</p>
      ) : (
        <div className="space-y-3">
          {days.map(({ date, dayOfWeek }) => {
            const daySlots = tutor.availability.filter((s) => s.dayOfWeek === dayOfWeek);
            if (daySlots.length === 0) return null;
            if ((tutor.unavailableDates || []).includes(date)) return null;
            const dateObj = new Date(`${date}T00:00:00`);
            return (
              <div key={date} className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-100 last:border-0">
                <span className="w-32 shrink-0 text-xs font-bold text-slate-700">
                  {t(DAY_KEYS[dayOfWeek])} — {dateObj.toLocaleDateString(intlLocale(language), { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map((slot, i) => {
                    const status = statusFor(date, slot.startTime);
                    const daySlot: DaySlot = { date, dayOfWeek, startTime: slot.startTime, endTime: slot.endTime };

                    if (!status) {
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-slate-600 px-2 py-1 bg-slate-50 rounded">{slot.startTime}–{slot.endTime}</span>
                          <button
                            onClick={() => openBooking(daySlot, 'INDIVIDUAL')}
                            className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded"
                          >
                            {t('individualSlot', { price: tutor.hourlyRate.iqd.toLocaleString() })}
                          </button>
                          {slot.allowsGroup && (
                            <button
                              onClick={() => openBooking(daySlot, 'GROUP')}
                              className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                            >
                              {t('startGroup', { price: tutor.groupRate.iqd.toLocaleString() })}
                            </button>
                          )}
                        </div>
                      );
                    }

                    if (status.type === 'INDIVIDUAL') {
                      return (
                        <span key={i} className="text-[11px] font-bold px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded">
                          {slot.startTime}–{slot.endTime} — {t('booked')}
                        </span>
                      );
                    }

                    if (status.isFull) {
                      return (
                        <span key={i} className="text-[11px] font-bold px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded">
                          {slot.startTime}–{slot.endTime} — {t('groupFull')}
                        </span>
                      );
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => openBooking(daySlot, 'GROUP', status.bookingId)}
                        className="text-[11px] font-bold px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded flex items-center gap-1"
                      >
                        <Users className="w-3 h-3" />
                        {slot.startTime}–{slot.endTime} — {t('joinSlot', { size: status.currentSize, max: status.maxGroupSize, price: status.pricePerStudent.iqd.toLocaleString() })}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
