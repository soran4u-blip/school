'use client';

import React from 'react';
import { useT } from '@/lib/useT';
import { LOCATIONS_COPY } from '../Locations.i18n';
import { Governorate, City } from '@/core/types/masterData';
import { Plus, Check } from 'lucide-react';

// The locations page's right-column cities panel for the selected governorate: the add-city
// mini-form and the cities table. The parent owns the cities list, the selected governorate, the
// add-city form state, and the submit handler.
export default function CitiesPanel({
  selectedGov,
  cities,
  isAddingCity,
  setIsAddingCity,
  cityForm,
  setCityForm,
  onSubmitCity,
}: {
  selectedGov: Governorate;
  cities: City[];
  isAddingCity: boolean;
  setIsAddingCity: (value: boolean) => void;
  cityForm: Partial<City>;
  setCityForm: (form: Partial<City>) => void;
  onSubmitCity: (e: React.FormEvent) => void;
}) {
  const t = useT(LOCATIONS_COPY);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span>{t('citiesIn')}</span>
            <span className="text-blue-600 font-black">{selectedGov.name.ar} ({selectedGov.name.en})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('citiesIntro')}
          </p>
        </div>

        <button
          onClick={() => setIsAddingCity(!isAddingCity)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('addCity')}</span>
        </button>
      </div>

      {/* Add City Mini-Form */}
      {isAddingCity && (
        <form onSubmit={onSubmitCity} className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-3">
          <h3 className="text-xs font-bold text-blue-900">{t('newCityDetails')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('cityId')}</label>
              <input
                type="text"
                placeholder="e.g. mansour, karkh"
                value={cityForm.id || ''}
                onChange={(e) => setCityForm({ ...cityForm, id: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('cityNameAr')}</label>
              <input
                type="text"
                placeholder="مثال: المنصور"
                value={cityForm.name?.ar || ''}
                onChange={(e) => setCityForm({ ...cityForm, name: { ...cityForm.name!, ar: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">{t('cityNameEn')}</label>
              <input
                type="text"
                placeholder="e.g. Al-Mansour"
                value={cityForm.name?.en || ''}
                onChange={(e) => setCityForm({ ...cityForm, name: { ...cityForm.name!, en: e.target.value } })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingCity(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
            >
              {t('saveCity')}
            </button>
          </div>
        </form>
      )}

      {/* Cities Table */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <table className="w-full text-xs text-start">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-start">{t('colNameAr')}</th>
              <th className="p-3 text-start">{t('colNameEn')}</th>
              <th className="p-3 text-start">{t('colSlug')}</th>
              <th className="p-3 text-center">{t('colStatus')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cities.length > 0 ? (
              cities.map((city) => (
                <tr key={city.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-semibold text-slate-900">{city.name.ar}</td>
                  <td className="p-3 text-slate-600">{city.name.en}</td>
                  <td className="p-3 font-mono text-slate-400">{city.slug}</td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      {t('active')}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400">
                  {t('noCities')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
