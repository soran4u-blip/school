'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';

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
  onClose,
}: {
  institution: Institution;
  form: { fullName: string; phone: string; email: string; message: string; hp: string };
  setForm: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; email: string; message: string; hp: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitted: boolean;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => { onClose(); }}
              className="absolute top-4 end-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-[#0B192C] mb-1">
              {t('طلب معلومات إضافية', 'Request More Info')}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {t('سيتواصل معك قسم القبول في', 'The admissions office at')} {language === 'en' ? institution.name.en : institution.name.ar} {t('في أقرب وقت.', 'will get back to you shortly.')}
            </p>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                {t('تم إرسال طلبك بنجاح! سنتواصل معك قريباً.', 'Your request was sent successfully! We will contact you soon.')}
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.hp}
                  onChange={(e) => setForm({ ...form, hp: e.target.value })}
                  className="absolute -left-[9999px] w-px h-px overflow-hidden"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  required
                  placeholder={t('الاسم الكامل', 'Full name')}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder={t('رقم الهاتف', 'Phone number')}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl font-mono"
                />
                <input
                  type="email"
                  placeholder={t('البريد الإلكتروني (اختياري)', 'Email (optional)')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <textarea
                  placeholder={t('رسالتك (اختياري)', 'Your message (optional)')}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {submitting ? t('جاري الإرسال...', 'Sending...') : t('إرسال الطلب', 'Send Request')}
                </button>
              </form>
            )}
          </div>
        </div>
  );
}
