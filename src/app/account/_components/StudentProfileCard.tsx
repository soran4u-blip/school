'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { TaxonomyItem } from '@/core/types/masterData';
import { GraduationCap, Save } from 'lucide-react';

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
  const { language, t } = useLanguage();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-4 h-4 text-emerald-700" />
        <h2 className="text-sm font-extrabold text-[#0B192C]">{t('ملفي الدراسي', 'My Student Profile')}</h2>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('المدرسة', 'School')}</label>
        <input
          type="text"
          value={profileSchool}
          onChange={(e) => setProfileSchool(e.target.value)}
          placeholder={t('اسم مدرستك أو جامعتك', 'Your school or university')}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('الصف الدراسي', 'Grade / Level')}</label>
        <select
          value={profileLevelId}
          onChange={(e) => setProfileLevelId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">{t('اختر الصف الدراسي', 'Select your grade / level')}</option>
          {studentLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>{language === 'en' ? lvl.name.en : lvl.name.ar}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">{t('المواد التي تهمك', 'Subjects of Interest')}</label>
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
                {language === 'en' ? sub.name.en : sub.name.ar}
              </label>
            );
          })}
          {subjects.length === 0 && (
            <span className="text-[11px] text-slate-400">{t('لا توجد مواد دراسية بعد', 'No subjects available yet')}</span>
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
        {t('حفظ الملف الشخصي', 'Save Profile')}
      </button>
    </div>
  );
}
