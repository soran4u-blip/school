'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { Institution } from '@/core/types/institution';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import LocalizedField from '@/components/shared/LocalizedField';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import AccountSettingsSection from '@/components/shared/AccountSettingsSection';
import { getInstitutionCompletenessFromGuardrails } from '@/lib/publishingGuardrails';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { INSTITUTION_COPY } from '../Institution.i18n';

// The institution dashboard's Profile tab: basic details form, accreditation documents, and the
// shared account-management footer (publish/pause, change password, danger zone).
export default function ProfileTab({
  institution,
  setInstitution,
  categories,
  governorates,
  taxonomies,
  facilitiesText,
  setFacilitiesText,
  verificationDocuments,
  setVerificationDocuments,
  handleSave,
  saving,

  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  changingPassword,
  passwordMessage,
  handleChangePassword,
  pausing,
  handleTogglePause,
  deletePassword,
  setDeletePassword,
  deletingAccount,
  deleteError,
  handleDeleteAccount,
}: {
  institution: Institution;
  setInstitution: (institution: Institution) => void;
  categories: Category[];
  governorates: Governorate[];
  taxonomies: TaxonomyItem[];
  facilitiesText: string;
  setFacilitiesText: (value: string) => void;
  verificationDocuments: string[];
  setVerificationDocuments: (urls: string[]) => void;
  handleSave: () => void;
  saving: boolean;

  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  changingPassword: boolean;
  passwordMessage: { text: string; type: 'success' | 'error' } | null;
  handleChangePassword: (e: React.FormEvent) => void;
  pausing: boolean;
  handleTogglePause: () => void;
  deletePassword: string;
  setDeletePassword: (value: string) => void;
  deletingAccount: boolean;
  deleteError: string;
  handleDeleteAccount: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('basicDetails')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label={t('logo')}
            value={institution.logoUrl || ''}
            onChange={(url) => setInstitution({ ...institution, logoUrl: url })}
            pathPrefix={`institutions/${institution.id}`}
          />
          <ImageUploadField
            label={t('coverImage')}
            value={institution.coverImageUrl || ''}
            onChange={(url) => setInstitution({ ...institution, coverImageUrl: url })}
            pathPrefix={`institutions/${institution.id}`}
          />
        </div>

        <LocalizedField
          labels={{ ar: t('nameAr'), en: t('nameEn'), ku: t('nameKu') }}
          value={institution.name}
          onChange={(v) => setInstitution({ ...institution, name: v })}
        />

        <LocalizedField
          labels={{ ar: t('taglineAr'), en: t('taglineEn'), ku: t('taglineKu') }}
          value={institution.tagline}
          onChange={(v) => setInstitution({ ...institution, tagline: v })}
        />

        <LocalizedField
          labels={{ ar: t('descriptionAr'), en: t('descriptionEn'), ku: t('descriptionKu') }}
          value={institution.description}
          onChange={(v) => setInstitution({ ...institution, description: v })}
          multiline
        />

        {/* Address is a LocalizedString and the public profile renders whichever half matches the
            visitor's language — but the form only ever exposed the Arabic one, so the English
            address could never be filled in. */}
        <LocalizedField
          labels={{ ar: t('addressAr'), en: t('addressEn'), ku: t('addressKu') }}
          value={institution.address}
          onChange={(v) => setInstitution({ ...institution, address: v })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('category')}</label>
            <select
              value={institution.categoryId || ''}
              onChange={(e) => setInstitution({ ...institution, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{pickLocalized(c.name, language)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')}</label>
            <select
              value={institution.governorateId || ''}
              onChange={(e) => setInstitution({ ...institution, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('selectGovernorate')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
            <input
              type="text"
              dir="ltr"
              value={institution.contact?.phonePrimary || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, phonePrimary: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsapp')}</label>
            <input
              type="text"
              dir="ltr"
              value={institution.contact?.whatsappNumber || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, whatsappNumber: e.target.value } })}
              placeholder="9647801234567"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
            <input
              type="email"
              value={institution.contact?.email || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, email: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('website')}</label>
            <input
              type="text"
              dir="ltr"
              value={institution.contact?.website || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, website: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
            />
          </div>
        </div>

        {/* Working hours show on the public contact card but had no field here at all, so no
            institution could ever set them. */}
        <LocalizedField
          labels={{ ar: t('hoursAr'), en: t('hoursEn'), ku: t('hoursKu') }}
          value={institution.contact?.workingHours}
          onChange={(v) => setInstitution({ ...institution, contact: { ...institution.contact, workingHours: v } })}
          placeholders={{ ar: 'الأحد - الخميس، 8:00 ص - 3:00 م', en: 'Sun - Thu, 8:00 AM - 3:00 PM', ku: 'یەکشەممە - پێنجشەممە، 8:00ی بەیانی - 3:00ی دوانیوەڕۆ' }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('establishedYear')}</label>
            <input
              type="number"
              value={institution.establishedYear || ''}
              onChange={(e) => setInstitution({ ...institution, establishedYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('genderPolicy')}</label>
            <select
              value={institution.genderPolicy || 'CO_ED'}
              onChange={(e) => setInstitution({ ...institution, genderPolicy: e.target.value as Institution['genderPolicy'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="CO_ED">{t('coEd')}</option>
              <option value="BOYS_ONLY">{t('boysOnly')}</option>
              <option value="GIRLS_ONLY">{t('girlsOnly')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('tuitionMin')}</label>
            <input
              type="number"
              value={institution.tuition?.min ?? 0}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, min: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('tuitionMax')}</label>
            <input
              type="number"
              value={institution.tuition?.max ?? 0}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, max: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('currency')}</label>
            <select
              value={institution.tuition?.currency || 'USD'}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, currency: e.target.value as 'IQD' | 'USD' } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="USD">USD</option>
              <option value="IQD">IQD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('period')}</label>
            <select
              value={institution.tuition?.period || 'YEAR'}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="YEAR">{t('periodYear')}</option>
              <option value="SEMESTER">{t('periodSemester')}</option>
              <option value="COURSE">{t('periodCourse')}</option>
            </select>
          </div>
        </div>

        <ChipMultiSelect
          label={t('accreditationsCurricula')}
          options={taxonomies.map((tax) => ({ id: tax.id, label: pickLocalized(tax.name, language) }))}
          selected={institution.taxonomyIds || []}
          onChange={(ids) => setInstitution({ ...institution, taxonomyIds: ids })}
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
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('accreditationDocs')}</h2>
        </div>
        <p className="text-[11px] text-slate-400">
          {t('accreditationHelp')}
        </p>
        <DocumentUploadField
          label=""
          value={verificationDocuments}
          onChange={setVerificationDocuments}
          pathPrefix={`institutions/${institution.id}/verification`}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? t('saving') : t('saveChanges')}</span>
        </button>
      </div>

      <AccountSettingsSection
        status={institution.status}
        completeness={getInstitutionCompletenessFromGuardrails(institution)}
        publishHeading={t('publishHeading')}
        publishDescription={t('publishDescription')}
        publishCompleteMessage={t('publishComplete')}
        visibilityHeading={t('visibilityHeading')}
        activeDescription={t('activeDescription')}
        pausedDescription={t('pausedDescription')}
        pauseLabel={t('pauseLabel')}
        resumeLabel={t('resumeLabel')}
        onTogglePause={handleTogglePause}
        pausing={pausing}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        changingPassword={changingPassword}
        passwordMessage={passwordMessage}
        onChangePassword={handleChangePassword}
        dangerZoneDescription={t('dangerZone')}
        deleteButtonLabel={t('deleteAccount')}
        deletePassword={deletePassword}
        setDeletePassword={setDeletePassword}
        deletingAccount={deletingAccount}
        deleteError={deleteError}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
