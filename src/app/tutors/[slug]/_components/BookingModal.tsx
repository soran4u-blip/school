'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { TaxonomyItem } from '@/core/types/masterData';
import { Check, MessageSquare, X } from 'lucide-react';
import type { DaySlot } from '../slots';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_PROFILE_COPY } from '../TutorProfile.i18n';

export type BookingForm = { subjectId: string; recurring: boolean; weeks: number };

// The booking dialog: pick a subject / weekly repeat, then show the outcome with follow-up links.
export default function BookingModal({
  tutor,
  subjects,
  selectedSlot,
  bookingMode,
  joinBookingId,
  form,
  setForm,
  submitting,
  result,
  formatDate,
  onSubmit,
  onClose,
}: {
  tutor: Tutor;
  subjects: TaxonomyItem[];
  selectedSlot: DaySlot;
  bookingMode: 'INDIVIDUAL' | 'GROUP';
  joinBookingId: string | undefined;
  form: BookingForm;
  setForm: (form: BookingForm) => void;
  submitting: boolean;
  result: { success: boolean; message: string } | null;
  formatDate: (date: string) => string;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_PROFILE_COPY);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 end-4 text-slate-400 hover:text-slate-700">
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-[#0B192C] mb-1">
          {bookingMode === 'INDIVIDUAL' ? t('bookIndividual') : joinBookingId ? t('joinGroup') : t('startNewGroup')}
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          {formatDate(selectedSlot.date)} • {selectedSlot.startTime}–{selectedSlot.endTime}
        </p>

        {result ? (
          <div className="space-y-3">
            <div className={`p-4 rounded-xl text-xs font-bold ${result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
              {result.message}
            </div>
            {result.success && (
              <a
                href={`https://wa.me/${tutor.whatsappNumber}?text=${encodeURIComponent(
                  t('confirmMessage', { date: formatDate(selectedSlot.date), time: selectedSlot.startTime })
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t('confirmWhatsApp')}
              </a>
            )}
            {result.success && (
              <Link
                href="/account"
                className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {t('viewBookings')}
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {subjects.length > 1 && (
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{pickLocalized(s.name, language)}</option>
                ))}
              </select>
            )}
            {bookingMode === 'INDIVIDUAL' && (
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.recurring}
                    onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>{t('repeatWeekly')}</span>
                </label>
                {form.recurring && (
                  <div className="flex items-center gap-2 ps-6">
                    <span className="text-[11px] text-slate-500">{t('forWeeksBefore')}</span>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={form.weeks}
                      onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })}
                      className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono"
                    />
                    <span className="text-[11px] text-slate-500">{t('forWeeksAfter')}</span>
                  </div>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {submitting ? t('bookingInProgress') : t('confirmBooking')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
