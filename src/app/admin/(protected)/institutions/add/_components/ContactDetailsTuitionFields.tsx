'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { TaxonomyItem } from '@/core/types/masterData';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import { useT } from '@/lib/useT';
import { INSTITUTION_FORM_COPY } from '../InstitutionForm.i18n';
import { pickLocalized } from '@/lib/localized';

// The add/edit institution form's contact, details, tuition, taxonomy, and facilities fields.
// The parent (InstitutionForm) owns the form state.
export default function ContactDetailsTuitionFields({
  form,
  setForm,
  taxonomies,
  facilitiesText,
  setFacilitiesText,
}: {
  form: Partial<Institution>;
  setForm: (form: Partial<Institution>) => void;
  taxonomies: TaxonomyItem[];
  facilitiesText: string;
  setFacilitiesText: (value: string) => void;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_FORM_COPY);

  return (
    <>
      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
          <input
            type="text"
            value={form.contact?.phonePrimary || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, phonePrimary: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsapp')}</label>
          <input
            type="text"
            value={form.contact?.whatsappNumber || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, whatsappNumber: e.target.value } })}
            placeholder="9647801234567"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
          <input
            type="email"
            value={form.contact?.email || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, email: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('website')}</label>
          <input
            type="text"
            value={form.contact?.website || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, website: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('establishedYear')}</label>
          <input
            type="number"
            value={form.establishedYear ?? ''}
            onChange={(e) => setForm({ ...form, establishedYear: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('genderPolicy')}</label>
          <select
            value={form.genderPolicy || 'CO_ED'}
            onChange={(e) => setForm({ ...form, genderPolicy: e.target.value as Institution['genderPolicy'] })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="CO_ED">{t('coEd')}</option>
            <option value="BOYS_ONLY">{t('boysOnly')}</option>
            <option value="GIRLS_ONLY">{t('girlsOnly')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('status')}</label>
          <select
            value={form.status || 'DRAFT'}
            onChange={(e) => setForm({ ...form, status: e.target.value as Institution['status'] })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="DRAFT">{t('statusDraft')}</option>
            <option value="ACTIVE">{t('statusActive')}</option>
            <option value="PENDING">{t('statusPending')}</option>
            <option value="SUSPENDED">{t('statusSuspended')}</option>
          </select>
        </div>
      </div>

      {/* Tuition */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('tuitionMin')}</label>
          <input
            type="number"
            value={form.tuition?.min ?? 0}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, min: Number(e.target.value) } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('tuitionMax')}</label>
          <input
            type="number"
            value={form.tuition?.max ?? 0}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, max: Number(e.target.value) } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('currency')}</label>
          <select
            value={form.tuition?.currency || 'USD'}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, currency: e.target.value as 'IQD' | 'USD' } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="USD">USD</option>
            <option value="IQD">IQD</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('period')}</label>
          <select
            value={form.tuition?.period || 'YEAR'}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="YEAR">{t('periodYear')}</option>
            <option value="SEMESTER">{t('periodSemester')}</option>
            <option value="COURSE">{t('periodCourse')}</option>
          </select>
        </div>
      </div>

      {/* Taxonomy multi-select */}
      <ChipMultiSelect
        label={t('accreditationsCurricula')}
        options={taxonomies.map(tax => ({ id: tax.id, label: pickLocalized(tax.name, language) }))}
        selected={form.taxonomyIds || []}
        onChange={(ids) => setForm({ ...form, taxonomyIds: ids })}
      />

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{t('facilities')}</label>
        <input
          type="text"
          value={facilitiesText}
          onChange={(e) => setFacilitiesText(e.target.value)}
          placeholder="Library, Sports Complex, Science Labs"
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
    </>
  );
}
