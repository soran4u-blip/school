'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { Governorate, Category } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import BilingualTextField from '@/components/shared/BilingualTextField';
import BilingualTextarea from '@/components/shared/BilingualTextarea';
import { useT } from '@/lib/useT';
import { INSTITUTION_FORM_COPY } from '../InstitutionForm.i18n';
import { pickLocalized } from '@/lib/localized';

// The add/edit institution form's identity, media, description, and address fields: ID/slug,
// bilingual name, category/governorate selects, logo/cover uploads, bilingual description, and
// address. The parent (InstitutionForm) owns the form state.
export default function IdentityMediaFields({
  form,
  setForm,
  editId,
  categories,
  governorates,
}: {
  form: Partial<Institution>;
  setForm: (form: Partial<Institution>) => void;
  editId: string | null;
  categories: Category[];
  governorates: Governorate[];
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_FORM_COPY);

  return (
    <>
      {/* Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('institutionId')} *</label>
          <input
            type="text"
            disabled={!!editId}
            value={form.id || ''}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="e.g. baghdad-tech-institute"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono disabled:bg-slate-50"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('slug')}</label>
          <input
            type="text"
            value={form.slug || ''}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder={t('leaveEmptyId')}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
          />
        </div>
      </div>

      <BilingualTextField
        labelAr={`${t('nameAr')} *`}
        labelEn={`${t('nameEn')} *`}
        valueAr={form.name?.ar || ''}
        valueEn={form.name?.en || ''}
        onChangeAr={(v) => setForm({ ...form, name: { ...form.name!, ar: v } })}
        onChangeEn={(v) => setForm({ ...form, name: { ...form.name!, en: v } })}
        required
      />

      <BilingualTextField
        labelAr={t('taglineAr')}
        labelEn={t('taglineEn')}
        valueAr={form.tagline?.ar || ''}
        valueEn={form.tagline?.en || ''}
        onChangeAr={(v) => setForm({ ...form, tagline: { ...form.tagline!, ar: v } })}
        onChangeEn={(v) => setForm({ ...form, tagline: { ...form.tagline!, en: v } })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('category')} *</label>
          <select
            value={form.categoryId || ''}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            required
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{pickLocalized(c.name, language)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')} *</label>
          <select
            value={form.governorateId || ''}
            onChange={(e) => setForm({ ...form, governorateId: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            required
          >
            <option value="">{t('selectGovernorate')}</option>
            {governorates.map(g => (
              <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageUploadField
          label={t('logo')}
          value={form.logoUrl || ''}
          onChange={(url) => setForm({ ...form, logoUrl: url })}
          pathPrefix={`institutions/${form.id || 'draft'}`}
        />
        <ImageUploadField
          label={t('cover')}
          value={form.coverImageUrl || ''}
          onChange={(url) => setForm({ ...form, coverImageUrl: url })}
          pathPrefix={`institutions/${form.id || 'draft'}`}
        />
      </div>

      {/* Descriptions */}
      <BilingualTextarea
        labelAr={t('descriptionAr')}
        labelEn={t('descriptionEn')}
        valueAr={form.description?.ar || ''}
        valueEn={form.description?.en || ''}
        onChangeAr={(v) => setForm({ ...form, description: { ...form.description!, ar: v } })}
        onChangeEn={(v) => setForm({ ...form, description: { ...form.description!, en: v } })}
      />

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{t('addressAr')}</label>
        <input
          type="text"
          value={form.address?.ar || ''}
          onChange={(e) => setForm({ ...form, address: { ar: e.target.value, en: form.address?.en || '' } })}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>
    </>
  );
}
