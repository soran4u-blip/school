'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Plus, Trash2 } from 'lucide-react';

// The add/edit institution form's academic programs list, uploaded verification documents
// display, and the verified/featured status checkboxes. The parent (InstitutionForm) owns the
// programs array, its add/remove/update handlers, and the form state for the checkboxes.
export default function ProgramsAndStatusFields({
  form,
  setForm,
  programs,
  addProgram,
  removeProgram,
  updateProgram,
  verificationDocuments,
}: {
  form: Partial<Institution>;
  setForm: (form: Partial<Institution>) => void;
  programs: InstitutionProgram[];
  addProgram: () => void;
  removeProgram: (id: string) => void;
  updateProgram: (id: string, patch: Partial<InstitutionProgram>) => void;
  verificationDocuments: string[];
}) {
  const { t } = useLanguage();

  return (
    <>
      {/* Academic Programs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold text-slate-700">{t('البرامج الأكاديمية والأقساط', 'Academic Programs & Tuition')}</label>
          <button
            type="button"
            onClick={addProgram}
            className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('إضافة برنامج', 'Add Program')}</span>
          </button>
        </div>

        {programs.length === 0 ? (
          <p className="text-[11px] text-slate-400">{t('لا توجد برامج مضافة بعد', 'No programs added yet')}</p>
        ) : (
          <div className="space-y-3">
            {programs.map((prog) => (
              <div key={prog.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t('اسم البرنامج (عربي)', 'Program name (Arabic)')}
                    value={prog.name.ar}
                    onChange={(e) => updateProgram(prog.id, { name: { ...prog.name, ar: e.target.value } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={t('اسم البرنامج (إنجليزي)', 'Program name (English)')}
                    value={prog.name.en}
                    onChange={(e) => updateProgram(prog.id, { name: { ...prog.name, en: e.target.value } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder={t('الكلية', 'Faculty')}
                    value={prog.facultyName.en}
                    onChange={(e) => updateProgram(prog.id, { facultyName: { ar: e.target.value, en: e.target.value } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder={t('عدد السنوات', 'Years')}
                    value={prog.durationYears}
                    onChange={(e) => updateProgram(prog.id, { durationYears: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <input
                    type="number"
                    placeholder={t('القسط السنوي', 'Annual Tuition')}
                    value={prog.tuitionAnnual.amount}
                    onChange={(e) => updateProgram(prog.id, { tuitionAnnual: { ...prog.tuitionAnnual, amount: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeProgram(prog.id)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('حذف', 'Remove')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {verificationDocuments.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <span className="text-xs font-bold text-amber-800">{t('وثائق الاعتماد المرفوعة', 'Uploaded Accreditation Documents')}</span>
          <div className="flex flex-wrap gap-2">
            {verificationDocuments.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-[11px] font-bold text-blue-700 hover:underline"
              >
                {t(`مستند ${idx + 1}`, `Document ${idx + 1}`)}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={form.isVerified ?? false}
            onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span>{t('معتمد رسمياً', 'Officially Verified')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={form.isFeatured ?? false}
            onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            className="rounded text-amber-600"
          />
          <span>{t('مميز في الواجهة', 'Featured on Homepage')}</span>
        </label>
      </div>
    </>
  );
}
