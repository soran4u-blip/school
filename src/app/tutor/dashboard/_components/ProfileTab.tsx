'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import ImageUploadField from '@/components/shared/ImageUploadField';
import PhotoFocalPointPicker from '@/components/shared/PhotoFocalPointPicker';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import LocalizedField from '@/components/shared/LocalizedField';
import ChipMultiSelect from '@/components/shared/ChipMultiSelect';
import AccountSettingsSection from '@/components/shared/AccountSettingsSection';
import { getTutorCompleteness } from '@/lib/utils';
import { TutorVerificationRequest } from '@/core/types/tutor';
import { Save, ShieldCheck, ShieldQuestion, UserCog } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

const DELIVERY_MODE_KEY = { ONLINE: 'modeOnline', IN_PERSON: 'modeInPerson', HYBRID: 'modeHybrid' } as const;

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
  verificationStatus,
  verificationRejectionReason,
  submittingVerification,
  onSubmitVerification,
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
  verificationStatus: TutorVerificationRequest['status'];
  verificationRejectionReason?: string;
  submittingVerification: boolean;
  onSubmitVerification: () => void;
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
  const t = useT(TUTOR_DASHBOARD_COPY);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <UserCog className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('personalDetails')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label={t('photo')}
            value={tutor.photoUrl || ''}
            onChange={(url) => {
              // Firestore rejects an explicit `undefined` field value, so drop the stale focal
              // point (it belonged to the old photo) rather than setting the key to undefined.
              const next: Tutor = { ...tutor, photoUrl: url };
              delete next.photoFocalPoint;
              setTutor(next);
            }}
            pathPrefix={`tutors/${tutor.id}`}
          />
        </div>

        {tutor.photoUrl && (
          <PhotoFocalPointPicker
            photoUrl={tutor.photoUrl}
            focalPoint={tutor.photoFocalPoint}
            onChange={(point) => setTutor({ ...tutor, photoFocalPoint: point })}
          />
        )}

        <LocalizedField
          labels={{ ar: t('fullNameAr'), en: t('fullNameEn'), ku: t('fullNameKu') }}
          value={tutor.fullName}
          onChange={(v) => setTutor({ ...tutor, fullName: v })}
        />

        <LocalizedField
          labels={{ ar: t('titleAr'), en: t('titleEn'), ku: t('titleKu') }}
          value={tutor.title}
          onChange={(v) => setTutor({ ...tutor, title: v })}
          placeholders={{ ar: 'أستاذ الفيزياء للفرع العلمي', en: 'Senior Physics Instructor', ku: 'مامۆستای بالای فیزیا بۆ بەشی زانستی' }}
        />

        <LocalizedField
          labels={{ ar: t('bioAr'), en: t('bioEn'), ku: t('bioKu') }}
          value={tutor.bio}
          onChange={(v) => setTutor({ ...tutor, bio: v })}
          multiline
          rows={4}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')}</label>
            <select
              value={tutor.governorateId || ''}
              onChange={(e) => setTutor({ ...tutor, governorateId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="">{t('selectGovernorate')}</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>{pickLocalized(g.name, language)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('yearsExperience')}</label>
            <input
              type="number"
              min={0}
              value={tutor.yearsOfExperience ?? 0}
              onChange={(e) => setTutor({ ...tutor, yearsOfExperience: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsappNumber')}</label>
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
          <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
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
                () => alert(t('locationFailed'))
              );
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            {t('useMyLocation')}
          </button>
          <span className="text-xs text-slate-500">
            {tutor.coordinates
              ? t('locationSet')
              : t('locationNotSet')}
          </span>
        </div>

        {/* Delivery Mode */}
        <ChipMultiSelect
          label={t('deliveryMode')}
          options={(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map((mode) => ({ id: mode, label: t(DELIVERY_MODE_KEY[mode]) }))}
          selected={tutor.deliveryMode || []}
          onChange={(ids) => setTutor({ ...tutor, deliveryMode: ids as Tutor['deliveryMode'] })}
          activeClassName="bg-emerald-600 text-white border-emerald-600"
        />

        {/* Subjects */}
        <ChipMultiSelect
          label={t('subjects')}
          options={subjects.map((sub) => ({ id: sub.id, label: pickLocalized(sub.name, language) }))}
          selected={tutor.subjectIds || []}
          onChange={(ids) => setTutor({ ...tutor, subjectIds: ids })}
          emptyMessage={t('noSubjects')}
        />

        {/* Student Levels / Grades */}
        <ChipMultiSelect
          label={t('grades')}
          options={studentLevels.map((lvl) => ({ id: lvl.id, label: pickLocalized(lvl.name, language) }))}
          selected={tutor.studentLevelIds || []}
          onChange={(ids) => setTutor({ ...tutor, studentLevelIds: ids })}
          emptyMessage={t('noGrades')}
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">{t('verificationDocs')}</h2>
        </div>
        <p className="text-[11px] text-slate-400">
          {t('verificationHelp')}
        </p>
        <DocumentUploadField
          label=""
          value={verificationDocuments}
          onChange={setVerificationDocuments}
          pathPrefix={`tutors/${tutor.id}/verification`}
        />

        {verificationStatus === 'PENDING' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <ShieldQuestion className="w-4 h-4 shrink-0" />
            <span>{t('verificationPending')}</span>
          </div>
        )}
        {verificationStatus === 'APPROVED' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t('verificationDone')}</span>
          </div>
        )}
        {verificationStatus === 'REJECTED' && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold space-y-1">
            <span>{t('verificationRejected')}</span>
            {verificationRejectionReason && <p className="font-normal">{verificationRejectionReason}</p>}
          </div>
        )}

        {(verificationStatus === 'NONE' || verificationStatus === 'REJECTED') && (
          <div className="flex justify-start">
            <button
              type="button"
              onClick={onSubmitVerification}
              disabled={verificationDocuments.length === 0 || submittingVerification}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{submittingVerification ? t('submitting') : t('submitForReview')}</span>
            </button>
          </div>
        )}
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
        status={tutor.status}
        completeness={getTutorCompleteness(tutor)}
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
        dangerZoneDescription={t('dangerDescription')}
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
