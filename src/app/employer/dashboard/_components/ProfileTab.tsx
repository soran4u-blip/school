'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { Employer } from '@/core/types/employer';
import { Governorate } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import { Building2, Save } from 'lucide-react';
import { EMPLOYER_COPY } from '../Employer.i18n';

// The employer dashboard's profile form. Employers previously had no way to edit their own
// details at all — name, logo, description and contact info could only be changed by an admin,
// even though firestore.rules already permits an owner to update their own document (everything
// they must not self-award — id, userId, status, createdAt — stays reserved there).
export default function ProfileTab({
  employer,
  setEmployer,
  governorates,
  handleSave,
  saving,
}: {
  employer: Employer;
  setEmployer: (employer: Employer) => void;
  governorates: Governorate[];
  handleSave: () => void;
  saving: boolean;
}) {
  const { language } = useLanguage();
  const t = useT(EMPLOYER_COPY);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-orange-600" />
        <h2 className="font-bold text-sm text-slate-900">{t('orgDetails')}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ImageUploadField
          label={t('logo')}
          value={employer.logoUrl || ''}
          onChange={(url) => setEmployer({ ...employer, logoUrl: url })}
          pathPrefix={`employers/${employer.id}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('name')}</label>
          <input
            type="text"
            value={employer.name || ''}
            onChange={(e) => setEmployer({ ...employer, name: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('orgType')}</label>
          <select
            value={employer.type || 'COMPANY'}
            onChange={(e) => setEmployer({ ...employer, type: e.target.value as Employer['type'] })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="COMPANY">{t('company')}</option>
            <option value="NGO">{t('ngo')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">{t('description')}</label>
        <textarea
          rows={4}
          value={employer.description || ''}
          onChange={(e) => setEmployer({ ...employer, description: e.target.value })}
          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')}</label>
          <select
            value={employer.governorateId || ''}
            onChange={(e) => setEmployer({ ...employer, governorateId: e.target.value })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
          >
            <option value="">{t('selectGovernorate')}</option>
            {governorates.map((g) => (
              <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
          <input
            type="email"
            value={employer.contact?.email || ''}
            onChange={(e) => setEmployer({ ...employer, contact: { ...employer.contact, email: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        {/* dir="ltr" so digits don't render right-aligned inside the Arabic RTL page. */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
          <input
            type="text"
            dir="ltr"
            placeholder="9647801234567"
            value={employer.contact?.phone || ''}
            onChange={(e) => setEmployer({ ...employer, contact: { ...employer.contact, phone: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsapp')}</label>
          <input
            type="text"
            dir="ltr"
            placeholder="9647801234567"
            value={employer.contact?.whatsappNumber || ''}
            onChange={(e) => setEmployer({ ...employer, contact: { ...employer.contact, whatsappNumber: e.target.value } })}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg text-xs font-bold disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? t('saving') : t('saveChanges')}
        </button>
      </div>
    </div>
  );
}
