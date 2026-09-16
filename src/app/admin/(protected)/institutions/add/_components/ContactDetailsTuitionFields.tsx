'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { TaxonomyItem } from '@/core/types/masterData';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';

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
  const { language, t } = useLanguage();

  return (
    <>
      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
          <input
            type="text"
            value={form.contact?.phonePrimary || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, phonePrimary: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
          <input
            type="text"
            value={form.contact?.whatsappNumber || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, whatsappNumber: e.target.value } })}
            placeholder="9647801234567"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
          <input
            type="email"
            value={form.contact?.email || ''}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact!, email: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('الموقع الإلكتروني', 'Website')}</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنة التأسيس', 'Established Year')}</label>
          <input
            type="number"
            value={form.establishedYear ?? ''}
            onChange={(e) => setForm({ ...form, establishedYear: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('نظام الطلاب', 'Gender Policy')}</label>
          <select
            value={form.genderPolicy || 'CO_ED'}
            onChange={(e) => setForm({ ...form, genderPolicy: e.target.value as Institution['genderPolicy'] })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="CO_ED">{t('مختلط', 'Co-Educational')}</option>
            <option value="BOYS_ONLY">{t('طلاب فقط', 'Boys Only')}</option>
            <option value="GIRLS_ONLY">{t('طالبات فقط', 'Girls Only')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('حالة النشر', 'Status')}</label>
          <select
            value={form.status || 'DRAFT'}
            onChange={(e) => setForm({ ...form, status: e.target.value as Institution['status'] })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="DRAFT">{t('مسودة', 'Draft')}</option>
            <option value="ACTIVE">{t('نشط', 'Active')}</option>
            <option value="PENDING">{t('قيد المراجعة', 'Pending')}</option>
            <option value="SUSPENDED">{t('موقوف', 'Suspended')}</option>
          </select>
        </div>
      </div>

      {/* Tuition */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأدنى للقسط', 'Tuition Min')}</label>
          <input
            type="number"
            value={form.tuition?.min ?? 0}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, min: Number(e.target.value) } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأعلى للقسط', 'Tuition Max')}</label>
          <input
            type="number"
            value={form.tuition?.max ?? 0}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, max: Number(e.target.value) } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('العملة', 'Currency')}</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('الدورية', 'Period')}</label>
          <select
            value={form.tuition?.period || 'YEAR'}
            onChange={(e) => setForm({ ...form, tuition: { ...form.tuition!, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="YEAR">{t('سنوي', 'Yearly')}</option>
            <option value="SEMESTER">{t('فصلي', 'Semester')}</option>
            <option value="COURSE">{t('دورة', 'Course')}</option>
          </select>
        </div>
      </div>

      {/* Taxonomy multi-select */}
      <ChipMultiSelect
        label={t('الاعتمادات والمناهج', 'Accreditations & Curricula')}
        options={taxonomies.map(tax => ({ id: tax.id, label: language === 'en' ? tax.name.en : tax.name.ar }))}
        selected={form.taxonomyIds || []}
        onChange={(ids) => setForm({ ...form, taxonomyIds: ids })}
      />

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{t('المرافق (مفصولة بفاصلة)', 'Facilities (comma-separated)')}</label>
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
