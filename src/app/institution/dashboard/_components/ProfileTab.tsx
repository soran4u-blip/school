'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import BilingualTextField from '@/components/shared/BilingualTextField';
import BilingualTextarea from '@/components/shared/BilingualTextarea';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import AccountSettingsSection from '@/components/shared/AccountSettingsSection';
import { getInstitutionCompletenessFromGuardrails } from '@/lib/publishingGuardrails';
import { Building2, Save, ShieldCheck } from 'lucide-react';

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
  const { language, t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-purple-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('البيانات الأساسية', 'Basic Details')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label={t('شعار المؤسسة', 'Institution Logo')}
            value={institution.logoUrl || ''}
            onChange={(url) => setInstitution({ ...institution, logoUrl: url })}
            pathPrefix={`institutions/${institution.id}`}
          />
          <ImageUploadField
            label={t('صورة الغلاف', 'Cover Image')}
            value={institution.coverImageUrl || ''}
            onChange={(url) => setInstitution({ ...institution, coverImageUrl: url })}
            pathPrefix={`institutions/${institution.id}`}
          />
        </div>

        <BilingualTextField
          labelAr={t('الاسم بالعربية', 'Name (Arabic)')}
          labelEn={t('الاسم بالإنجليزية', 'Name (English)')}
          valueAr={institution.name?.ar || ''}
          valueEn={institution.name?.en || ''}
          onChangeAr={(v) => setInstitution({ ...institution, name: { ...institution.name, ar: v } })}
          onChangeEn={(v) => setInstitution({ ...institution, name: { ...institution.name, en: v } })}
        />

        <BilingualTextField
          labelAr={t('الشعار التعريفي بالعربية', 'Tagline (Arabic)')}
          labelEn={t('الشعار التعريفي بالإنجليزية', 'Tagline (English)')}
          valueAr={institution.tagline?.ar || ''}
          valueEn={institution.tagline?.en || ''}
          onChangeAr={(v) => setInstitution({ ...institution, tagline: { ...institution.tagline, ar: v } })}
          onChangeEn={(v) => setInstitution({ ...institution, tagline: { ...institution.tagline, en: v } })}
        />

        <BilingualTextarea
          labelAr={t('الوصف بالعربية', 'Description (Arabic)')}
          labelEn={t('الوصف بالإنجليزية', 'Description (English)')}
          valueAr={institution.description?.ar || ''}
          valueEn={institution.description?.en || ''}
          onChangeAr={(v) => setInstitution({ ...institution, description: { ...institution.description, ar: v } })}
          onChangeEn={(v) => setInstitution({ ...institution, description: { ...institution.description, en: v } })}
        />

        {/* Address is a LocalizedString and the public profile renders whichever half matches the
            visitor's language — but the form only ever exposed the Arabic one, so the English
            address could never be filled in. */}
        <BilingualTextField
          labelAr={t('العنوان بالعربية', 'Address (Arabic)')}
          labelEn={t('العنوان بالإنجليزية', 'Address (English)')}
          valueAr={institution.address?.ar || ''}
          valueEn={institution.address?.en || ''}
          onChangeAr={(v) => setInstitution({ ...institution, address: { ...institution.address, ar: v } })}
          onChangeEn={(v) => setInstitution({ ...institution, address: { ...institution.address, en: v } })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الفئة', 'Category')}</label>
            <select
              value={institution.categoryId || ''}
              onChange={(e) => setInstitution({ ...institution, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('اختر الفئة', 'Select category')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{language === 'en' ? c.name.en : c.name.ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('المحافظة', 'Governorate')}</label>
            <select
              value={institution.governorateId || ''}
              onChange={(e) => setInstitution({ ...institution, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
            <input
              type="text"
              dir="ltr"
              value={institution.contact?.phonePrimary || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, phonePrimary: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
            <input
              type="email"
              value={institution.contact?.email || ''}
              onChange={(e) => setInstitution({ ...institution, contact: { ...institution.contact, email: e.target.value } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الموقع الإلكتروني', 'Website')}</label>
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
        <BilingualTextField
          labelAr={t('ساعات الدوام بالعربية', 'Working Hours (Arabic)')}
          labelEn={t('ساعات الدوام بالإنجليزية', 'Working Hours (English)')}
          valueAr={institution.contact?.workingHours?.ar || ''}
          valueEn={institution.contact?.workingHours?.en || ''}
          onChangeAr={(v) => setInstitution({ ...institution, contact: { ...institution.contact, workingHours: { ar: v, en: institution.contact?.workingHours?.en || '' } } })}
          onChangeEn={(v) => setInstitution({ ...institution, contact: { ...institution.contact, workingHours: { ar: institution.contact?.workingHours?.ar || '', en: v } } })}
          placeholderAr="الأحد - الخميس، 8:00 ص - 3:00 م"
          placeholderEn="Sun - Thu, 8:00 AM - 3:00 PM"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنة التأسيس', 'Established Year')}</label>
            <input
              type="number"
              value={institution.establishedYear || ''}
              onChange={(e) => setInstitution({ ...institution, establishedYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('نظام الطلاب', 'Gender Policy')}</label>
            <select
              value={institution.genderPolicy || 'CO_ED'}
              onChange={(e) => setInstitution({ ...institution, genderPolicy: e.target.value as Institution['genderPolicy'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="CO_ED">{t('مختلط', 'Co-Educational')}</option>
              <option value="BOYS_ONLY">{t('طلاب فقط', 'Boys Only')}</option>
              <option value="GIRLS_ONLY">{t('طالبات فقط', 'Girls Only')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأدنى للقسط', 'Tuition Min')}</label>
            <input
              type="number"
              value={institution.tuition?.min ?? 0}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, min: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأعلى للقسط', 'Tuition Max')}</label>
            <input
              type="number"
              value={institution.tuition?.max ?? 0}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, max: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('العملة', 'Currency')}</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الدورية', 'Period')}</label>
            <select
              value={institution.tuition?.period || 'YEAR'}
              onChange={(e) => setInstitution({ ...institution, tuition: { ...institution.tuition, period: e.target.value as 'YEAR' | 'SEMESTER' | 'COURSE' } })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="YEAR">{t('سنوي', 'Yearly')}</option>
              <option value="SEMESTER">{t('فصلي', 'Semester')}</option>
              <option value="COURSE">{t('دورة', 'Course')}</option>
            </select>
          </div>
        </div>

        <ChipMultiSelect
          label={t('الاعتمادات والمناهج', 'Accreditations & Curricula')}
          options={taxonomies.map((tax) => ({ id: tax.id, label: language === 'en' ? tax.name.en : tax.name.ar }))}
          selected={institution.taxonomyIds || []}
          onChange={(ids) => setInstitution({ ...institution, taxonomyIds: ids })}
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
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('وثائق الاعتماد', 'Accreditation Documents')}</h2>
        </div>
        <p className="text-[11px] text-slate-400">
          {t('ارفع وثائق الاعتماد الرسمية لمساعدة الإدارة على توثيق مؤسستك — هذه الوثائق خاصة ولا تظهر للعامة.', "Upload official accreditation documents to help the admin verify your institution — these documents are private and never shown publicly.")}
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
          <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}</span>
        </button>
      </div>

      <AccountSettingsSection
        status={institution.status}
        completeness={getInstitutionCompletenessFromGuardrails(institution)}
        publishHeading={t('نشر الملف في الدليل العام', 'Publish to the Directory')}
        publishDescription={t(
          'ملفك غير منشور بعد ولا يظهر لزوار الموقع. أكمل المعلومات التالية ليراجعها فريقنا.',
          "Your profile isn't published yet and can't be seen by visitors. Complete the following and our team will review it."
        )}
        publishCompleteMessage={t(
          'ملفك مكتمل وبانتظار مراجعة الإدارة. سيظهر في الدليل العام فور الموافقة عليه.',
          'Your profile is complete and waiting for admin review. It goes live in the public directory once approved.'
        )}
        visibilityHeading={t('ظهور الملف للعامة', 'Directory Visibility')}
        activeDescription={t('ملف مؤسستك ظاهر حالياً في الدليل العام.', "Your institution's profile is currently visible in the public directory.")}
        pausedDescription={t('ملف مؤسستك متوقف مؤقتاً ولن يظهر في الدليل العام.', "Your institution's profile is paused and hidden from the public directory.")}
        pauseLabel={t('إيقاف الملف مؤقتاً', 'Pause Profile')}
        resumeLabel={t('تفعيل الملف مجدداً', 'Resume Profile')}
        onTogglePause={handleTogglePause}
        pausing={pausing}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        changingPassword={changingPassword}
        passwordMessage={passwordMessage}
        onChangePassword={handleChangePassword}
        dangerZoneDescription={t('حذف حساب مؤسستك نهائياً — سيُخفى الملف عن العامة. لا يمكن التراجع عن هذا الإجراء.', "Permanently delete your institution's account — the profile disappears from the directory. This cannot be undone.")}
        deleteButtonLabel={t('حذف الحساب نهائياً', 'Delete Account')}
        deletePassword={deletePassword}
        setDeletePassword={setDeletePassword}
        deletingAccount={deletingAccount}
        deleteError={deleteError}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
