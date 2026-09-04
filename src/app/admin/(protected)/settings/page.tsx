'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { SystemSettings } from '@/core/types/masterData';
import { Settings, Save, AlertCircle, CheckCircle2, Megaphone } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const s = await MasterDataService.getSystemSettings();
      setSettings(s);
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await MasterDataService.updateSystemSettings(settings);
    setMessage({ text: t('تم حفظ إعدادات النظام بنجاح وتطبيقها فورياً', 'System settings saved successfully'), type: 'success' });
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>{t('إعدادات النظام واللافتات العامة', 'System Settings & Announcements')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t(
            'التحكم في شريط الإعلانات العاجل، سعر صرف الدينار العراقي، ومعلومات التواصل الرسمية للمنصة.',
            'Manage site-wide announcement banners, exchange rates, and official contacts.'
          )}
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
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
                {t('شريط التنبيهات والإعلانات العاجلة أعلى الموقع', 'Emergency Top Announcement Ticker')}
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={settings.emergencyAnnouncement?.enabled ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  emergencyAnnouncement: {
                    ...settings.emergencyAnnouncement!,
                    enabled: e.target.checked,
                    text: settings.emergencyAnnouncement?.text || { ar: '', en: '' },
                    level: 'INFO'
                  }
                })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>{t('تفعيل الشريط العاجل', 'Enable Announcement')}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('نص الإعلان (بالعربية)', 'Announcement Text (Arabic)')}</label>
              <input
                type="text"
                value={settings.emergencyAnnouncement?.text.ar || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  emergencyAnnouncement: {
                    ...settings.emergencyAnnouncement!,
                    enabled: settings.emergencyAnnouncement?.enabled ?? true,
                    level: 'INFO',
                    text: { ...settings.emergencyAnnouncement?.text!, ar: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('نص الإعلان (بالإنجليزية)', 'Announcement Text (English)')}</label>
              <input
                type="text"
                value={settings.emergencyAnnouncement?.text.en || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  emergencyAnnouncement: {
                    ...settings.emergencyAnnouncement!,
                    enabled: settings.emergencyAnnouncement?.enabled ?? true,
                    level: 'INFO',
                    text: { ...settings.emergencyAnnouncement?.text!, en: e.target.value }
                  }
                })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Currency & Exchange Rates */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            {t('العملة وسعر الصرف التقريبي', 'Currency & Exchange Rate')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('سعر صرف الدولار مقابل الدينار العراقي (1 USD = X IQD)', 'USD to IQD Exchange Rate')}
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
            {t('بيانات الاتصال والدعم الرسمي للمنصة', 'Official Contact & Support')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('البريد الإلكتروني', 'Email')}</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف الرسمي', 'Official Phone')}</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('واتساب الاستفسارات', 'WhatsApp Support')}</label>
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
            <span>{t('حفظ وتطبيق جميع الإعدادات', 'Save System Settings')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
