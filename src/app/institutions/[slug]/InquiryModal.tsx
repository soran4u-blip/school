'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from './Institution.i18n';

// The "Request more info" dialog on an institution profile. Its own file because it is a whole
// form with its own submitted/failed states, and it shares nothing with the profile tabs beyond
// the institution's name.
export default function InquiryModal({
  institution,
  form,
  setForm,
  onSubmit,
  submitting,
  submitted,
  error,
  onClose,
}: {
  institution: Institution;
  form: { fullName: string; phone: string; email: string; message: string; hp: string };
  setForm: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; email: string; message: string; hp: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitted: boolean;
  error: string;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="presentation">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inquiry-dialog-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700"
              aria-label={t('close')}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 id="inquiry-dialog-title" className="text-base font-extrabold text-[#0B192C] mb-1">
              {t('requestInfo')}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {t('inquiryIntro', { name: pickLocalized(institution.name, language) })}
            </p>

            {submitted ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  {t('inquirySent')}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  {t('backToProfile')}
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.hp}
                  onChange={(e) => setForm((prev) => ({ ...prev, hp: e.target.value }))}
                  className="absolute -left-[9999px] w-px h-px overflow-hidden"
                  aria-hidden="true"
                />
                <label htmlFor="inquiry-full-name" className="sr-only">{t('fullName')}</label>
                <input
                  id="inquiry-full-name"
                  type="text"
                  required
                  maxLength={100}
                  autoFocus
                  placeholder={t('fullName')}
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <label htmlFor="inquiry-phone" className="sr-only">{t('phone')}</label>
                <input
                  id="inquiry-phone"
                  type="text"
                  required
                  maxLength={30}
                  inputMode="tel"
                  dir="ltr"
                  placeholder={t('phone')}
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl font-mono"
                />
                <label htmlFor="inquiry-email" className="sr-only">{t('emailLabel')}</label>
                <input
                  id="inquiry-email"
                  type="email"
                  maxLength={200}
                  placeholder={t('emailOptional')}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <label htmlFor="inquiry-message" className="sr-only">{t('yourMessage')}</label>
                <textarea
                  id="inquiry-message"
                  maxLength={3000}
                  placeholder={t('messageOptional')}
                  value={form.message}
                  onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                {error && <p className="text-[11px] font-bold text-rose-600" role="alert">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {submitting ? t('sending') : t('sendRequest')}
                </button>
              </form>
            )}
          </div>
        </div>
  );
}