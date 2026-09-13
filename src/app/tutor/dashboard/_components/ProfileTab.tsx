'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import BilingualTextField from '@/components/shared/BilingualTextField';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import AccountSettingsSection from '@/components/shared/AccountSettingsSection';
import { getTutorCompleteness } from '@/lib/utils';
import { Save, ShieldCheck, UserCog } from 'lucide-react';

// The tutor dashboard's Profile tab: personal details form, verification documents, and the
// shared account-management footer (publish/pause, change password, danger zone).
export default function ProfileTab({
  tutor,
  setTutor,
  governorates,
  subjects,
  studentLevels,
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
  tutor: Tutor;
  setTutor: (tutor: Tutor) => void;
  governorates: Governorate[];
  subjects: TaxonomyItem[];
  studentLevels: TaxonomyItem[];
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
          <UserCog className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('البيانات الشخصية', 'Personal Details')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label={t('الصورة الشخصية', 'Photo')}
            value={tutor.photoUrl || ''}
            onChange={(url) => setTutor({ ...tutor, photoUrl: url })}
            pathPrefix={`tutors/${tutor.id}`}
          />
        </div>

        <BilingualTextField
          labelAr={t('الاسم الكامل بالعربية', 'Full Name (Arabic)')}
          labelEn={t('الاسم الكامل بالإنجليزية', 'Full Name (English)')}
          valueAr={tutor.fullName?.ar || ''}
          valueEn={tutor.fullName?.en || ''}
          onChangeAr={(v) => setTutor({ ...tutor, fullName: { ...tutor.fullName, ar: v } })}
          onChangeEn={(v) => setTutor({ ...tutor, fullName: { ...tutor.fullName, en: v } })}
        />

        <BilingualTextField
          labelAr={t('اللقب المهني بالعربية', 'Title (Arabic)')}
          labelEn={t('اللقب المهني بالإنجليزية', 'Title (English)')}
          valueAr={tutor.title?.ar || ''}
          valueEn={tutor.title?.en || ''}
          onChangeAr={(v) => setTutor({ ...tutor, title: { ...tutor.title, ar: v } })}
          onChangeEn={(v) => setTutor({ ...tutor, title: { ...tutor.title, en: v } })}
          placeholderAr="أستاذ الفيزياء للفرع العلمي"
          placeholderEn="Senior Physics Instructor"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('نبذة تعريفية بالعربية', 'Bio (Arabic)')}</label>
            <textarea rows={4} value={tutor.bio?.ar || ''} onChange={(e) => setTutor({ ...tutor, bio: { ar: e.target.value, en: tutor.bio?.en || '' } })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('نبذة تعريفية بالإنجليزية', 'Bio (English)')}</label>
            <textarea rows={4} dir="ltr" value={tutor.bio?.en || ''} onChange={(e) => setTutor({ ...tutor, bio: { ar: tutor.bio?.ar || '', en: e.target.value } })} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('المحافظة', 'Governorate')}</label>
            <select
              value={tutor.governorateId || ''}
              onChange={(e) => setTutor({ ...tutor, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنوات الخبرة', 'Years of Experience')}</label>
            <input
              type="number"
              min={0}
              value={tutor.yearsOfExperience ?? 0}
              onChange={(e) => setTutor({ ...tutor, yearsOfExperience: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
            <input
              type="text"
              dir="ltr"
              placeholder="9647801234567"
              value={tutor.whatsappNumber || ''}
              onChange={(e) => setTutor({ ...tutor, whatsappNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
          <input
            type="text"
            dir="ltr"
            placeholder="9647801234567"
            value={tutor.phone || ''}
            onChange={(e) => setTutor({ ...tutor, phone: e.target.value })}
            className="w-full sm:w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono text-left"
          />
        </div>

        {/* Location for "near me" search — no map, just a one-tap browser geolocation capture */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(
                (pos) => setTutor({ ...tutor, coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
                () => alert(t('تعذر الوصول إلى الموقع', 'Could not access your location'))
              );
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            {t('استخدام موقعي الحالي', 'Use My Current Location')}
          </button>
          <span className="text-xs text-slate-500">
            {tutor.coordinates
              ? t('تم تحديد الموقع — سيظهر في نتائج "القريب مني"', 'Location set — you\'ll appear in "Near Me" search results')
              : t('لم يتم تحديد الموقع — الظهور حسب المحافظة فقط', 'Not set — only governorate-level matching for now')}
          </span>
        </div>

        {/* Delivery Mode */}
        <ChipMultiSelect
          label={t('طريقة التدريس', 'Delivery Mode')}
          options={(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map((mode) => ({ id: mode, label: mode.replace('_', ' ') }))}
          selected={tutor.deliveryMode || []}
          onChange={(ids) => setTutor({ ...tutor, deliveryMode: ids as Tutor['deliveryMode'] })}
          activeClassName="bg-emerald-600 text-white border-emerald-600"
        />

        {/* Subjects */}
        <ChipMultiSelect
          label={t('المواد الدراسية', 'Subjects')}
          options={subjects.map((sub) => ({ id: sub.id, label: language === 'en' ? sub.name.en : sub.name.ar }))}
          selected={tutor.subjectIds || []}
          onChange={(ids) => setTutor({ ...tutor, subjectIds: ids })}
          emptyMessage={t('لا توجد مواد دراسية بعد', 'No subjects available yet')}
        />

        {/* Student Levels / Grades */}
        <ChipMultiSelect
          label={t('الصفوف الدراسية', 'Grades / Student Levels')}
          options={studentLevels.map((lvl) => ({ id: lvl.id, label: language === 'en' ? lvl.name.en : lvl.name.ar }))}
          selected={tutor.studentLevelIds || []}
          onChange={(ids) => setTutor({ ...tutor, studentLevelIds: ids })}
          emptyMessage={t('لا توجد صفوف دراسية بعد', 'No grades available yet')}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('وثائق التوثيق', 'Verification Documents')}</h2>
        </div>
        <p className="text-[11px] text-slate-400">
          {t('ارفع صورة هويتك أو شهاداتك لمساعدة الإدارة على توثيق ملفك — هذه الوثائق خاصة ولا تظهر للعامة.', 'Upload your ID or certificates to help the admin verify your profile — these documents are private and never shown publicly.')}
        </p>
        <DocumentUploadField
          label=""
          value={verificationDocuments}
          onChange={setVerificationDocuments}
          pathPrefix={`tutors/${tutor.id}/verification`}
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
        status={tutor.status}
        completeness={getTutorCompleteness(tutor)}
        publishHeading={t('نشر ملفك في الدليل العام', 'Publish to the Directory')}
        publishDescription={t(
          'ملفك غير منشور بعد ولا يظهر للطلاب. أكمل المعلومات التالية ليراجعها فريقنا.',
          "Your profile isn't published yet and can't be seen by students. Complete the following and our team will review it."
        )}
        publishCompleteMessage={t(
          'ملفك مكتمل وبانتظار مراجعة الإدارة. سيظهر للطلاب فور الموافقة عليه.',
          'Your profile is complete and waiting for admin review. It becomes visible to students once approved.'
        )}
        visibilityHeading={t('ظهور الملف للطلاب', 'Profile Visibility')}
        activeDescription={t('ملفك ظاهر حالياً في الدليل العام ويمكن للطلاب حجز مواعيد جديدة.', 'Your profile is currently visible in the public directory and students can book new sessions.')}
        pausedDescription={t('ملفك متوقف مؤقتاً ولن يظهر للطلاب حتى تُفعّله مجدداً.', 'Your profile is paused and hidden from students until you resume it.')}
        pauseLabel={t('إيقاف الملف مؤقتاً', 'Pause My Profile')}
        resumeLabel={t('تفعيل الملف مجدداً', 'Resume My Profile')}
        onTogglePause={handleTogglePause}
        pausing={pausing}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        changingPassword={changingPassword}
        passwordMessage={passwordMessage}
        onChangePassword={handleChangePassword}
        dangerZoneDescription={t('حذف حسابك نهائياً — سيُخفى ملفك عن الطلاب وتُلغى حجوزاتك القادمة. لا يمكن التراجع عن هذا الإجراء.', 'Permanently delete your account — your profile disappears from the directory and any upcoming bookings are cancelled. This cannot be undone.')}
        deleteButtonLabel={t('حذف حسابي نهائياً', 'Delete My Account')}
        deletePassword={deletePassword}
        setDeletePassword={setDeletePassword}
        deletingAccount={deletingAccount}
        deleteError={deleteError}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
