'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Trash2, Save, Users } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { InstitutionProgram } from '@/core/types/institution';

// The institution dashboard's Programs tab. Programs live as an array on the institution
// document rather than in a subcollection, so saving them goes through the same saveInstitution
// call as the rest of the profile — hence `handleSave` coming in as a prop instead of a local one.
export default function ProgramsTab({
  programs,
  admissionApplicationCounts,
  addProgram,
  removeProgram,
  updateProgram,
  handleSave,
  saving,
}: {
  programs: InstitutionProgram[];
  admissionApplicationCounts: Record<string, number>;
  addProgram: () => void;
  removeProgram: (id: string) => void;
  updateProgram: (id: string, patch: Partial<InstitutionProgram>) => void;
  handleSave: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();

  return (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900">{t('البرامج الأكاديمية والأقساط', 'Academic Programs & Tuition')}</h2>
              <button
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
                    {/* Faculty gets one input per language, same as the program name above. It used
                        to be a single field writing the same string into both halves, so typing an
                        Arabic faculty name silently overwrote the English one (and vice versa). */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder={t('الكلية (عربي)', 'Faculty (Arabic)')}
                        value={prog.facultyName.ar}
                        onChange={(e) => updateProgram(prog.id, { facultyName: { ...prog.facultyName, ar: e.target.value } })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder={t('الكلية (إنجليزي)', 'Faculty (English)')}
                        value={prog.facultyName.en}
                        onChange={(e) => updateProgram(prog.id, { facultyName: { ...prog.facultyName, en: e.target.value } })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('عدد سنوات الدراسة', 'Duration (Years)')}</label>
                        <input
                          type="number"
                          placeholder={t('عدد السنوات', 'Years')}
                          value={prog.durationYears}
                          onChange={(e) => updateProgram(prog.id, { durationYears: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('القسط السنوي', 'Annual Tuition')}</label>
                        {/* Currency sits with the amount: programs used to be locked to the USD
                            default they were created with, with no way for an institution pricing
                            in dinars to say so. */}
                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder={t('القسط السنوي', 'Annual Tuition')}
                            value={prog.tuitionAnnual.amount}
                            onChange={(e) => updateProgram(prog.id, { tuitionAnnual: { ...prog.tuitionAnnual, amount: Number(e.target.value) } })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                          />
                          <select
                            value={prog.tuitionAnnual.currency}
                            onChange={(e) => updateProgram(prog.id, { tuitionAnnual: { ...prog.tuitionAnnual, currency: e.target.value as 'IQD' | 'USD' } })}
                            className="px-1.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold shrink-0"
                          >
                            <option value="IQD">IQD</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => removeProgram(prog.id)}
                          className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('حذف', 'Remove')}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('السعة (اختياري)', 'Capacity (optional)')}</label>
                        <input
                          type="number"
                          min={0}
                          placeholder={t('غير محدود', 'Unlimited')}
                          value={prog.capacity ?? ''}
                          onChange={(e) => updateProgram(prog.id, { capacity: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('آخر موعد للتقديم', 'Application Deadline')}</label>
                        <input
                          type="date"
                          value={prog.applicationDeadline || ''}
                          onChange={(e) => updateProgram(prog.id, { applicationDeadline: e.target.value || undefined })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer self-end pb-1.5">
                        <input
                          type="checkbox"
                          checked={prog.isAcceptingApplications !== false}
                          onChange={(e) => updateProgram(prog.id, { isAcceptingApplications: e.target.checked })}
                          className="rounded text-emerald-600"
                        />
                        <span>{t('يقبل الطلبات حالياً', 'Accepting applications')}</span>
                      </label>
                      <div className="flex flex-col items-start justify-end gap-1">
                        <span className="text-[11px] font-bold text-slate-600">
                          {prog.acceptedCount || 0}{prog.capacity != null ? ` / ${prog.capacity}` : ''} {t('مقبول', 'accepted')}
                        </span>
                        <Link
                          href={`/institution/dashboard/programs/${prog.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{admissionApplicationCounts[prog.id] || 0} {t('متقدم', 'applicants')}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ البرامج', 'Save Programs')}</span>
              </button>
            </div>
          </div>
  );
}
