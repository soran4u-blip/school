'use client';

import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '@/core/services/masterDataService';
import { SystemSettings } from '@/core/types/masterData';
import { Settings, Save, CheckCircle2, Megaphone, Wrench } from 'lucide-react';
import { useT } from '@/lib/useT';
import { SETTINGS_COPY } from './Settings.i18n';

export default function AdminSettingsPage() {
  const t = useT(SETTINGS_COPY);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const s = await getSystemSettings();
      setSettings(s);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      await updateSystemSettings(settings);
      setMessage({ text: t('saved'), type: 'success' });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : t('saveFailed'), type: 'error' });
    }
  };

  // Every field of the announcement is written together, defaulted from what's already there.
  // The previous version spread `settings.emergencyAnnouncement!` — a non-null assertion on a
  // genuinely optional field — so typing into the Arabic box before an announcement existed
  // produced `{ text: { ar } }` with `en` missing, and the banner rendered `undefined` in
  // English.
  type Announcement = NonNullable<SystemSettings['emergencyAnnouncement']>;
  const patchAnnouncement = (patch: Partial<Omit<Announcement, 'text'>> & { text?: Partial<Announcement['text']> }) => {
    if (!settings) return;
    const current = settings.emergencyAnnouncement;
    setSettings({
      ...settings,
      emergencyAnnouncement: {
        enabled: current?.enabled ?? true,
        level: current?.level ?? 'INFO',
        ...patch,
        text: { ar: '', en: '', ...current?.text, ...patch.text },
      },
    });
  };

  const handleRepairCounters = async () => {
    setRepairing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/maintenance/counters', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Repair failed');
      const total = body.ratings.repairedCount + body.applicantCounts.repairedCount;
      setMessage({
        text: total === 0
          ? t('countersOk')
          : t(total === 1 ? 'repairedOne' : 'repairedMany', { n: total }),
        type: 'success',
      });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : t('repairFailed'), type: 'error' });
    } finally {
      setRepairing(false);
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Emergency Announcement Banner */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-900">
                {t('tickerTitle')}
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={settings.emergencyAnnouncement?.enabled ?? true}
                onChange={(e) => patchAnnouncement({ enabled: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>{t('enableTicker')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('textAr')}</label>
              <input
                type="text"
                value={settings.emergencyAnnouncement?.text.ar || ''}
                onChange={(e) => patchAnnouncement({ text: { ar: e.target.value } })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('textEn')}</label>
              <input
                type="text"
                value={settings.emergencyAnnouncement?.text.en || ''}
                onChange={(e) => patchAnnouncement({ text: { en: e.target.value } })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Currency & Exchange Rates */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            {t('currencyTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('exchangeRate')}
              </label>
              <input
                type="number"
                value={settings.exchangeRateUsdToIqd}
                onChange={(e) => setSettings({ ...settings, exchangeRateUsdToIqd: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            {t('contactTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('whatsapp')}</label>
              <input
                type="text"
                value={settings.contactWhatsApp}
                onChange={(e) => setSettings({ ...settings, contactWhatsApp: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] shadow-sm transition-colors"
          >
            <Save className="w-4 h-4 text-[#F1C40F]" />
            <span>{t('saveAll')}</span>
          </button>
        </div>
      </form>

      {/* Denormalized-counter maintenance */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Wrench className="w-5 h-5 text-slate-500" />
          <h2 className="font-bold text-sm text-slate-900">{t('countersTitle')}</h2>
        </div>
        <p className="text-xs text-slate-500">
          {t('countersBody')}
        </p>
        <button
          type="button"
          onClick={handleRepairCounters}
          disabled={repairing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-60"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>{repairing ? t('checking') : t('checkRepair')}</span>
        </button>
      </div>
    </div>
  );
}
