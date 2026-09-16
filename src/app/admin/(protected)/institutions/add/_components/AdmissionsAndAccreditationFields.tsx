'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution, InstitutionAdmissions, InstitutionAccreditation } from '@/core/types/institution';
import { Plus, Trash2 } from 'lucide-react';

function admissionsValue(form: Partial<Institution>): InstitutionAdmissions {
  return form.admissions || {};
}

function accreditationValue(form: Partial<Institution>): InstitutionAccreditation {
  return form.accreditation || {};
}

export default function AdmissionsAndAccreditationFields({
  form,
  setForm,
}: {
  form: Partial<Institution>;
  setForm: (form: Partial<Institution>) => void;
}) {
  const { t } = useLanguage();
  const admissions = admissionsValue(form);
  const accreditation = accreditationValue(form);
  const documents = admissions.requiredDocuments || [];

  const updateAdmissions = (patch: Partial<InstitutionAdmissions>) => {
    setForm({ ...form, admissions: { ...admissions, ...patch } });
  };

  const updateAccreditation = (patch: Partial<InstitutionAccreditation>) => {
    setForm({ ...form, accreditation: { ...accreditation, ...patch } });
  };

  const addDocument = () => {
    updateAdmissions({ requiredDocuments: [...documents, { ar: '', en: '' }] });
  };

  const updateDocument = (index: number, patch: { ar?: string; en?: string }) => {
    updateAdmissions({
      requiredDocuments: documents.map((document, documentIndex) => (
        documentIndex === index ? { ...document, ...patch } : document
      )),
    });
  };

  const removeDocument = (index: number) => {
    updateAdmissions({ requiredDocuments: documents.filter((_, documentIndex) => documentIndex !== index) });
  };

  return (
    <div className="space-y-5 border-t border-slate-100 pt-5">
      <div>
        <h2 className="text-sm font-extrabold text-[#0B192C]">
          {t('بيانات القبول والاعتماد', 'Admissions & Accreditation Details')}
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          {t(
            'هذه البيانات تظهر للعائلات في الملف العام. أضف المعلومات المؤكدة فقط؛ لا تستخدم نصوصاً عامة أو تقديرات.',
            'These details appear on the public profile. Add verified information only; avoid generic claims or estimates.'
          )}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          {t('ملخص القبول (عربي / إنجليزي)', 'Admissions overview (Arabic / English)')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={admissions.overview?.ar || ''}
            onChange={(e) => updateAdmissions({ overview: { ...admissions.overview, ar: e.target.value, en: admissions.overview?.en || '' } })}
            placeholder={t('مثال: يبدأ التسجيل في شهر أيلول...', 'Example: Applications open in September...')}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <textarea
            value={admissions.overview?.en || ''}
            onChange={(e) => updateAdmissions({ overview: { ...admissions.overview, ar: admissions.overview?.ar || '', en: e.target.value } })}
            placeholder="Example: Applications open in September..."
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-xs font-bold text-slate-700">
            {t('المستمسكات المطلوبة', 'Required documents')}
          </label>
          <button
            type="button"
            onClick={addDocument}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('إضافة مستند', 'Add document')}</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-[11px] text-slate-400">
            {t('لم تتم إضافة مستندات بعد', 'No required documents added yet')}
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((document, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <input
                  type="text"
                  value={document.ar}
                  onChange={(e) => updateDocument(index, { ar: e.target.value })}
                  placeholder={t('المستند بالعربية', 'Document in Arabic')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={document.en}
                  onChange={(e) => updateDocument(index, { en: e.target.value })}
                  placeholder={t('المستند بالإنجليزية', 'Document in English')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                  aria-label={t('حذف المستند', 'Remove document')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          {t('ملاحظات القبول (اختياري)', 'Admissions notes (optional)')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={admissions.notes?.ar || ''}
            onChange={(e) => updateAdmissions({ notes: { ...admissions.notes, ar: e.target.value, en: admissions.notes?.en || '' } })}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <textarea
            value={admissions.notes?.en || ''}
            onChange={(e) => updateAdmissions({ notes: { ...admissions.notes, ar: admissions.notes?.ar || '', en: e.target.value } })}
            rows={2}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          {t('جهة الاعتماد', 'Accrediting authority')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={accreditation.authority?.ar || ''}
            onChange={(e) => updateAccreditation({ authority: { ...accreditation.authority, ar: e.target.value, en: accreditation.authority?.en || '' } })}
            placeholder={t('الجهة بالعربية', 'Authority in Arabic')}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={accreditation.authority?.en || ''}
            onChange={(e) => updateAccreditation({ authority: { ...accreditation.authority, ar: accreditation.authority?.ar || '', en: e.target.value } })}
            placeholder={t('الجهة بالإنجليزية', 'Authority in English')}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={accreditation.details?.ar || ''}
            onChange={(e) => updateAccreditation({ details: { ...accreditation.details, ar: e.target.value, en: accreditation.details?.en || '' } })}
            placeholder={t('تفاصيل الاعتماد بالعربية', 'Accreditation details in Arabic')}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <textarea
            value={accreditation.details?.en || ''}
            onChange={(e) => updateAccreditation({ details: { ...accreditation.details, ar: accreditation.details?.ar || '', en: e.target.value } })}
            placeholder={t('تفاصيل الاعتماد بالإنجليزية', 'Accreditation details in English')}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t('تاريخ آخر تحقق', 'Last verified date')}
          </label>
          <input
            type="date"
            value={accreditation.verifiedAt || ''}
            onChange={(e) => updateAccreditation({ verifiedAt: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
      </div>
    </div>
  );
}