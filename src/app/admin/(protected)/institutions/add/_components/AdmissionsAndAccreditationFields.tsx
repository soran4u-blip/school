'use client';

import React from 'react';
import { Institution, InstitutionAdmissions, InstitutionAccreditation } from '@/core/types/institution';
import { Plus, Trash2 } from 'lucide-react';
import { useT } from '@/lib/useT';
import { INSTITUTION_FORM_COPY } from '../InstitutionForm.i18n';

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
  const t = useT(INSTITUTION_FORM_COPY);
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
          {t('admissionsTitle')}
        </h2>
        <p className="text-[11px] text-slate-500 mt-1">
          {t('admissionsHint')}
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700">
          {t('admissionsOverview')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={admissions.overview?.ar || ''}
            onChange={(e) => updateAdmissions({ overview: { ...admissions.overview, ar: e.target.value, en: admissions.overview?.en || '' } })}
            placeholder={t('admissionsExample')}
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
            {t('requiredDocuments')}
          </label>
          <button
            type="button"
            onClick={addDocument}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addDocument')}</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-[11px] text-slate-400">
            {t('noDocuments')}
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((document, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                <input
                  type="text"
                  value={document.ar}
                  onChange={(e) => updateDocument(index, { ar: e.target.value })}
                  placeholder={t('documentAr')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={document.en}
                  onChange={(e) => updateDocument(index, { en: e.target.value })}
                  placeholder={t('documentEn')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                  aria-label={t('removeDocument')}
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
          {t('admissionsNotes')}
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
          {t('accreditingAuthority')}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={accreditation.authority?.ar || ''}
            onChange={(e) => updateAccreditation({ authority: { ...accreditation.authority, ar: e.target.value, en: accreditation.authority?.en || '' } })}
            placeholder={t('authorityAr')}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={accreditation.authority?.en || ''}
            onChange={(e) => updateAccreditation({ authority: { ...accreditation.authority, ar: accreditation.authority?.ar || '', en: e.target.value } })}
            placeholder={t('authorityEn')}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <textarea
            value={accreditation.details?.ar || ''}
            onChange={(e) => updateAccreditation({ details: { ...accreditation.details, ar: e.target.value, en: accreditation.details?.en || '' } })}
            placeholder={t('accreditationAr')}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
          <textarea
            value={accreditation.details?.en || ''}
            onChange={(e) => updateAccreditation({ details: { ...accreditation.details, ar: accreditation.details?.ar || '', en: e.target.value } })}
            placeholder={t('accreditationEn')}
            rows={3}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {t('lastVerified')}
          </label>
          <input
            type="date"
            value={accreditation.verifiedAt || ''}
            onChange={(e) => updateAccreditation({ verifiedAt: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('evidenceUrl')}
            </label>
            <input
              type="url"
              value={accreditation.sourceUrl || ''}
              onChange={(e) => updateAccreditation({ sourceUrl: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('evidenceExpiry')}
            </label>
            <input
              type="date"
              value={accreditation.expiresAt || ''}
              onChange={(e) => updateAccreditation({ expiresAt: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
