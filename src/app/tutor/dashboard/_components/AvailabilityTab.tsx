'use client';

import React from 'react';
import { Plus, Trash2, Save, Calendar, X } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { AvailabilitySlot, Tutor } from '@/core/types/tutor';
import { formatDate as formatDateUtil } from '@/lib/utils';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

const DAY_LABELS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sunday' },
  { ar: 'الاثنين', en: 'Monday' },
  { ar: 'الثلاثاء', en: 'Tuesday' },
  { ar: 'الأربعاء', en: 'Wednesday' },
  { ar: 'الخميس', en: 'Thursday' },
  { ar: 'الجمعة', en: 'Friday' },
  { ar: 'السبت', en: 'Saturday' },
];

// The tutor dashboard's Availability tab: the weekly recurring pattern plus one-off blocked dates.
// Both are fields on the tutor document, so saving runs through the dashboard's own handleSave.
export default function AvailabilityTab({
  tutor,
  setTutor,
  availability,
  unavailableDates,
  addSlot,
  removeSlot,
  updateSlot,
  addBlockedDate,
  removeBlockedDate,
  newBlockedDate,
  setNewBlockedDate,
  handleSave,
  saving,
}: {
  // Group-session pricing lives on the tutor document and is edited from this tab alongside the
  // schedule, since both describe what a bookable slot actually is.
  tutor: Tutor;
  setTutor: (tutor: Tutor) => void;
  availability: AvailabilitySlot[];
  unavailableDates: string[];
  addSlot: (dayOfWeek: number) => void;
  removeSlot: (index: number) => void;
  updateSlot: (index: number, patch: Partial<AvailabilitySlot>) => void;
  addBlockedDate: () => void;
  removeBlockedDate: (date: string) => void;
  newBlockedDate: string;
  setNewBlockedDate: (date: string) => void;
  handleSave: () => void;
  saving: boolean;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_DASHBOARD_COPY);
  const formatDate = (date: string) => formatDateUtil(date, language, { weekday: undefined, year: 'numeric' });

  return (
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="font-bold text-sm text-slate-900">{t('pricing')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('individualPrice')}</label>
                  <input
                    type="number"
                    value={tutor.hourlyRate?.iqd ?? 0}
                    onChange={(e) => setTutor({ ...tutor, hourlyRate: { ...tutor.hourlyRate, iqd: Number(e.target.value) } })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('groupPrice')}</label>
                  <input
                    type="number"
                    value={tutor.groupRate?.iqd ?? 0}
                    onChange={(e) => setTutor({ ...tutor, groupRate: { ...tutor.groupRate, iqd: Number(e.target.value) } })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">{t('groupPriceHint')}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('maxGroupSize')}</label>
                  <input
                    type="number"
                    min={2}
                    value={tutor.groupMaxSize ?? 4}
                    onChange={(e) => setTutor({ ...tutor, groupMaxSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Weekly Availability */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-sm text-slate-900">{t('weeklyAvailability')}</h2>
              </div>

              <div className="space-y-3">
                {DAY_LABELS.map((day, dayOfWeek) => {
                  const daySlots = availability
                    .map((slot, idx) => ({ slot, idx }))
                    .filter(({ slot }) => slot.dayOfWeek === dayOfWeek);
                  return (
                    <div key={dayOfWeek} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-slate-100 last:border-0">
                      <span className="w-24 shrink-0 text-xs font-bold text-slate-700 pt-2">{pickLocalized(day, language)}</span>
                      <div className="flex-1 space-y-2">
                        {daySlots.map(({ slot, idx }) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(idx, { startTime: e.target.value })}
                              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                            />
                            <span className="text-xs text-slate-400">–</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(idx, { endTime: e.target.value })}
                              className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                            />
                            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!slot.allowsGroup}
                                onChange={(e) => updateSlot(idx, { allowsGroup: e.target.checked })}
                              />
                              <span>{t('allowGroup')}</span>
                            </label>
                            <button onClick={() => removeSlot(idx)} className="p-1.5 text-slate-400 hover:text-rose-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addSlot(dayOfWeek)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('addTimeBlock')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Blocked Dates (vacation / one-off unavailability) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                <h2 className="font-bold text-sm text-slate-900">{t('blockedDates')}</h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {t('blockedDatesHint')}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
                <button
                  onClick={addBlockedDate}
                  disabled={!newBlockedDate}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('blockDate')}</span>
                </button>
              </div>
              {unavailableDates.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {unavailableDates.map((date) => (
                    <span key={date} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-mono font-bold">
                      {formatDate(date)}
                      <button onClick={() => removeBlockedDate(date)} className="hover:text-rose-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
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
          </div>
  );
}
