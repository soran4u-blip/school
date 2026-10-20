'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import {
  KeyRound, PauseCircle, PlayCircle, Rocket, AlertCircle, Trash2,
} from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { ACCOUNT_SETTINGS_COPY } from './SharedPanels.i18n';

// The account-management footer shared by the institution and tutor dashboard Profile tabs:
// the publish-to-directory nudge (while PENDING), the pause/resume visibility toggle, the
// change-password form, and the danger-zone account deletion. The parent page owns all of the
// state and handlers (same as the rest of the *Tab convention) — this component only renders and
// wires callbacks, parameterized by the copy that differs between institutions and tutors.
export default function AccountSettingsSection({
  status,
  completeness,
  publishHeading,
  publishDescription,
  publishCompleteMessage,
  visibilityHeading,
  activeDescription,
  pausedDescription,
  pauseLabel,
  resumeLabel,
  onTogglePause,
  pausing,

  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  changingPassword,
  passwordMessage,
  onChangePassword,

  dangerZoneDescription,
  deleteButtonLabel,
  deletePassword,
  setDeletePassword,
  deletingAccount,
  deleteError,
  onDeleteAccount,
}: {
  status: string;
  completeness: { complete: boolean; missingFields: { ar: string; en: string }[] };
  publishHeading: string;
  publishDescription: string;
  publishCompleteMessage: string;
  visibilityHeading: string;
  activeDescription: string;
  pausedDescription: string;
  pauseLabel: string;
  resumeLabel: string;
  onTogglePause: () => void;
  pausing: boolean;

  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  changingPassword: boolean;
  passwordMessage: { text: string; type: 'success' | 'error' } | null;
  onChangePassword: (e: React.FormEvent) => void;

  dangerZoneDescription: string;
  deleteButtonLabel: string;
  deletePassword: string;
  setDeletePassword: (value: string) => void;
  deletingAccount: boolean;
  deleteError: string;
  onDeleteAccount: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(ACCOUNT_SETTINGS_COPY);

  return (
    <>
      {status === 'PENDING' || status === 'DRAFT' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-sm text-slate-900">{publishHeading}</h2>
          </div>
          <p className="text-xs text-slate-500">{publishDescription}</p>
          {completeness.complete ? (
            <div className="flex items-start gap-2 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <Rocket className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span className="font-medium">{publishCompleteMessage}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                {completeness.missingFields.map((f) => (
                  <li key={f.en} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{pickLocalized(f, language)}</span>
                  </li>
                ))}
              </ul>
              <p className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-400">
                <Rocket className="w-3.5 h-3.5" />
                <span>{t('completeAbove')}</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            {status === 'ACTIVE' ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
            <h2 className="font-bold text-sm text-slate-900">{visibilityHeading}</h2>
          </div>
          <p className="text-xs text-slate-500">
            {status === 'ACTIVE' ? activeDescription : pausedDescription}
          </p>
          <button
            onClick={onTogglePause}
            disabled={pausing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60 ${
              status === 'ACTIVE' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            {status === 'ACTIVE' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
            <span>
              {pausing ? t('updating') : status === 'ACTIVE' ? pauseLabel : resumeLabel}
            </span>
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-sm text-slate-900">{t('changePassword')}</h2>
        </div>
        <form onSubmit={onChangePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('currentPassword')}</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('newPassword')}</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              autoComplete="new-password"
            />
          </div>
          {passwordMessage && (
            <p className={`text-xs font-bold px-3 py-2 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={changingPassword}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-60"
          >
            {changingPassword ? t('changing') : t('updatePassword')}
          </button>
        </form>
      </div>

      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <h2 className="font-bold text-sm text-rose-900">{t('dangerZone')}</h2>
        </div>
        <p className="text-xs text-rose-700">{dangerZoneDescription}</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-sm">
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder={t('passwordToConfirm')}
            className="flex-1 w-full px-3 py-2 text-xs border border-rose-200 rounded-lg"
          />
          <button
            onClick={onDeleteAccount}
            disabled={deletingAccount || !deletePassword}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deletingAccount ? t('deleting') : deleteButtonLabel}</span>
          </button>
        </div>
        {deleteError && (
          <p className="text-xs font-bold px-3 py-2 rounded-lg bg-rose-100 text-rose-800">{deleteError}</p>
        )}
      </div>
    </>
  );
}
