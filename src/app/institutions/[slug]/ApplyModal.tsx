'use client';

import React from 'react';
import Link from 'next/link';
import { X, Paperclip, FileText } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { INSTITUTION_COPY } from './Institution.i18n';

// The admissions-application dialog on an institution profile — file uploads and all.
export default function ApplyModal({
  institution,
  applyProgram,
  applyForm,
  setApplyForm,
  applyDocumentNames,
  uploadingDocument,
  onDocument,
  onSubmit,
  submitting,
  result,
  onClose,
}: {
  institution: Institution;
  applyProgram: InstitutionProgram;
  applyForm: { message: string };
  setApplyForm: React.Dispatch<React.SetStateAction<{ message: string }>>;
  applyDocumentNames: string[];
  uploadingDocument: boolean;
  onDocument: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  result: { success: boolean; message: string } | null;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 end-4 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-[#0B192C] mb-1">
              {t('applyTo')} {pickLocalized(applyProgram.name, language)}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {pickLocalized(institution.name, language)}
            </p>

            {result?.success ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {result.message}
                </div>
                <Link
                  href="/account"
                  className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {t('viewMyApplications')}
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <textarea
                  placeholder={t('statement')}
                  value={applyForm.message}
                  onChange={(e) => setApplyForm({ message: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl"
                />

                <div className="space-y-2">
                  <label className="flex items-center gap-2 w-fit px-3.5 py-2 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{uploadingDocument ? t('uploading') : t('attach')}</span>
                    <input type="file" accept="image/*,application/pdf" onChange={onDocument} disabled={uploadingDocument} className="hidden" />
                  </label>
                  {applyDocumentNames.length > 0 && (
                    <ul className="text-[11px] text-slate-500 space-y-0.5">
                      {applyDocumentNames.map((name, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {result && !result.success && (
                  <div className="p-3 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800">
                    {result.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || uploadingDocument}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {submitting ? t('submitting') : t('submitApplication')}
                </button>
              </form>
            )}
          </div>
        </div>
  );
}
