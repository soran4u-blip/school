'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Governorate } from '@/core/types/masterData';
import { Save, X } from 'lucide-react';

// The locations page's add/edit governorate form. The parent owns the form state, whether it's
// showing the add or edit variant, and the submit/cancel handlers.
export default function GovernorateForm({
  govForm,
  setGovForm,
  isAddingGov,
  isEditingGov,
  onSubmit,
  onCancel,
}: {
  govForm: Partial<Governorate>;
  setGovForm: (form: Partial<Governorate>) => void;
  isAddingGov: boolean;
  isEditingGov: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="font-bold text-base text-slate-900">
          {isAddingGov ? t('إضافة محافظة جديدة', 'Add New Governorate') : t('تعديل بيانات المحافظة', 'Edit Governorate')}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('معرّف المحافظة (ID)', 'Governorate ID (slug)')} *</label>
            <input
              type="text"
              disabled={isEditingGov}
              value={govForm.id || ''}
              onChange={(e) => setGovForm({ ...govForm, id: e.target.value })}
              placeholder="e.g. halabja, baghdad"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 disabled:bg-slate-50 font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('رمز المحافظة (Code)', 'Code')} *</label>
            <input
              type="text"
              value={govForm.code || ''}
              onChange={(e) => setGovForm({ ...govForm, code: e.target.value })}
              placeholder="e.g. HL, BG"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالعربية', 'Name (Arabic)')} *</label>
            <input
              type="text"
              value={govForm.name?.ar || ''}
              onChange={(e) => setGovForm({ ...govForm, name: { ...govForm.name!, ar: e.target.value } })}
              placeholder="مثال: حلبجة الشهيدة"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم بالإنجليزية', 'Name (English)')} *</label>
            <input
              type="text"
              value={govForm.name?.en || ''}
              onChange={(e) => setGovForm({ ...govForm, name: { ...govForm.name!, en: e.target.value } })}
              placeholder="e.g. Halabja"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('الإقليم / المنطقة', 'Region')}</label>
            <select
              value={govForm.region || 'CENTRAL'}
              onChange={(e) => setGovForm({ ...govForm, region: e.target.value as Governorate['region'] })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 bg-white"
            >
              <option value="CENTRAL">Central (الوسط)</option>
              <option value="KURDISTAN">Kurdistan (إقليم كوردستان)</option>
              <option value="SOUTH">South (الجنوب)</option>
              <option value="NORTH">North (الشمال)</option>
              <option value="WEST">West (الغرب)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('خط العرض (Lat)', 'Latitude')}</label>
            <input
              type="number"
              step="any"
              value={govForm.lat || ''}
              onChange={(e) => setGovForm({ ...govForm, lat: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('خط الطول (Lng)', 'Longitude')}</label>
            <input
              type="number"
              step="any"
              value={govForm.lng || ''}
              onChange={(e) => setGovForm({ ...govForm, lng: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-blue-500 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={govForm.isActive ?? true}
              onChange={(e) => setGovForm({ ...govForm, isActive: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>{t('المحافظة مفعّلة في نتائج البحث', 'Active in search results')}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {t('إلغاء', 'Cancel')}
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t('حفظ التغييرات', 'Save Governorate')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
