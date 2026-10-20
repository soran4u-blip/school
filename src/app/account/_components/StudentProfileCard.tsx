'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { TaxonomyItem } from '@/core/types/masterData';
import { GraduationCap, Save } from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { ACCOUNT_COPY } from '../Account.i18n';

// The account page's "My Student Profile" card: school, grade/level, and subjects of interest.
// The parent owns all form state and the save handler.
export default function StudentProfileCard({
  profileSchool,
  setProfileSchool,
  profileLevelId,
  setProfileLevelId,
  profileSubjectIds,
  setProfileSubjectIds,
  subjects,
  studentLevels,
  savingProfile,
  profileMessage,
  onSave,
}: {
  profileSchool: string;
  setProfileSchool: (value: string) => void;
  profileLevelId: string;
  setProfileLevelId: (value: string) => void;
  profileSubjectIds: string[];
  setProfileSubjectIds: (ids: string[]) => void;
  subjects: TaxonomyItem[];
  studentLevels: TaxonomyItem[];
  savingProfile: boolean;
  profileMessage: string;
  onSave: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(ACCOUNT_COPY);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-emerald-700" />
        <h2 className="text-sm font-extrabold text-[#0B192C]">{t('profileTitle')}</h2>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('school')}</label>
        <input
          type="text"
          value={profileSchool}
          onChange={(e) => setProfileSchool(e.target.value)}
          placeholder={t('schoolPlaceholder')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('gradeLevel')}</label>
        <select
          value={profileLevelId}
          onChange={(e) => setProfileLevelId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t('selectGrade')}</option>
          {studentLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>{pickLocalized(lvl.name, language)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">{t('subjectsOfInterest')}</label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((sub) => {
            const checked = profileSubjectIds.includes(sub.id);
            return (
              <label
                key={sub.id}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                  checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={checked}
                  onChange={(e) => {
                    const ids = new Set(profileSubjectIds);
                    if (e.target.checked) ids.add(sub.id); else ids.delete(sub.id);
                    setProfileSubjectIds(Array.from(ids));
                  }}
                />
                {pickLocalized(sub.name, language)}
              </label>
            );
          })}
          {subjects.length === 0 && (
            <span className="text-[11px] text-slate-400">{t('noSubjects')}</span>
          )}
        </div>
      </div>

      {profileMessage && (
        <p className="text-xs font-semibold text-emerald-700">{profileMessage}</p>
      )}

      <button
        onClick={onSave}
        disabled={savingProfile}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold disabled:opacity-60"
      >
        <Save className="w-3.5 h-3.5" />
        {t('saveProfile')}
      </button>
    </div>
  );
}
