'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Category, Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { Tutor } from '@/core/types/tutor';
import SearchAutocomplete from '@/components/shared/SearchAutocomplete';
import {
  Search,
  ShieldCheck,
  Star,
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Navigation,
} from 'lucide-react';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { EXPLORE_COPY } from '../Explore.i18n';

// The explore page's left faceted-filters sidebar: keyword search, price range, rating
// threshold, near-me distance, category/governorate selects, accreditation/curriculum
// checkboxes, and the verified-only toggle. The parent (ExploreDirectory) owns all filter
// state and handlers; this component only renders and wires callbacks.
export default function FilterSidebar({
  institutions,
  tutors,
  subjects,
  categories,
  governorates,
  accreditations,
  curricula,

  searchQuery,
  setSearchQuery,

  priceCurrency,
  setPriceCurrency,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,

  minRating,
  setMinRating,

  nearMeCoords,
  nearMeError,
  radiusKm,
  setRadiusKm,
  toggleNearMe,

  selectedCategory,
  setSelectedCategory,

  selectedGov,
  setSelectedGov,

  selectedAccreditations,
  toggleAccreditation,

  selectedCurricula,
  toggleCurriculum,

  verifiedOnly,
  setVerifiedOnly,

  mobileFilterOpen,
  setMobileFilterOpen,

  clearFilters,
}: {
  institutions: Institution[];
  tutors: Tutor[];
  subjects: TaxonomyItem[];
  categories: Category[];
  governorates: Governorate[];
  accreditations: TaxonomyItem[];
  curricula: TaxonomyItem[];

  searchQuery: string;
  setSearchQuery: (value: string) => void;

  priceCurrency: 'IQD' | 'USD';
  setPriceCurrency: (value: 'IQD' | 'USD') => void;
  priceMin: string;
  setPriceMin: (value: string) => void;
  priceMax: string;
  setPriceMax: (value: string) => void;

  minRating: number;
  setMinRating: (value: number) => void;

  nearMeCoords: { lat: number; lng: number } | null;
  nearMeError: string;
  radiusKm: number;
  setRadiusKm: (value: number) => void;
  toggleNearMe: () => void;

  selectedCategory: string;
  setSelectedCategory: (value: string) => void;

  selectedGov: string;
  setSelectedGov: (value: string) => void;

  selectedAccreditations: string[];
  toggleAccreditation: (id: string) => void;

  selectedCurricula: string[];
  toggleCurriculum: (id: string) => void;

  verifiedOnly: boolean;
  setVerifiedOnly: (value: boolean) => void;

  mobileFilterOpen: boolean;
  setMobileFilterOpen: (value: boolean) => void;

  clearFilters: () => void;
}) {
  const { language } = useLanguage();
  const t = useT(EXPLORE_COPY);

  return (
    <aside className={`lg:col-span-4 space-y-6 ${mobileFilterOpen ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto block' : 'hidden lg:block'}`}>
      {mobileFilterOpen && (
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <h3 className="font-extrabold text-slate-900 text-sm">{t('filters')}</h3>
          <button onClick={() => setMobileFilterOpen(false)} className="p-1 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">

        {/* Header & Reset */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-700" />
            <span className="font-extrabold text-sm text-[#0B192C]">{t('filterBy')}</span>
          </div>
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('reset')}</span>
          </button>
        </div>

        {/* Keyword Search Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('keywordSearch')}</label>
          <div className="relative">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={() => {}}
              placeholder={t('keywordPlaceholder')}
              className="w-full"
              inputClassName="w-full text-xs px-3 py-2.5 ps-9 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600 font-medium"
              institutions={institutions}
              tutors={tutors}
              subjects={subjects}
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-3 start-3 pointer-events-none" />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700">{t('annualBudget')}</label>
            <div className="flex rounded-lg overflow-hidden border border-slate-200 text-[10px] font-bold">
              {(['IQD', 'USD'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setPriceCurrency(cur)}
                  className={`px-2 py-1 ${priceCurrency === cur ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder={t('min')}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-blue-600"
            />
            <span className="text-slate-300 text-xs">—</span>
            <input
              type="number"
              min={0}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder={t('max')}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-blue-600"
            />
          </div>
        </div>

        {/* Rating Threshold */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('minRating')}</label>
          <div className="flex gap-2">
            {[0, 3, 4].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(r)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  minRating === r ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {r === 0 ? (
                  t('any')
                ) : (
                  <>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {r}+
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Near Me */}
        <div>
          <button
            type="button"
            onClick={toggleNearMe}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
              nearMeCoords ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{nearMeCoords ? t('nearMeOn') : t('nearMe')}</span>
          </button>
          {nearMeCoords && (
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full mt-2 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
            >
              {[5, 10, 25, 50, 100].map((km) => (
                <option key={km} value={km}>{t('withinKm', { km })}</option>
              ))}
            </select>
          )}
          {nearMeError && <p className="text-[11px] text-rose-600 mt-1.5">{nearMeError}</p>}
        </div>

        {/* Categories Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('category')}</label>
          <div className="space-y-1.5">
            <label
              onClick={() => setSelectedCategory('all')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                selectedCategory === 'all' ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-600 font-medium'
              }`}
            >
              <span>{t('allCategories')}</span>
              <span className="text-[10px] text-slate-400 font-mono">{institutions.length}</span>
            </label>

            {categories.filter((cat) => cat.slug !== 'tutors').map((cat) => {
              const count = institutions.filter(i => i.categoryId === cat.slug).length;
              const isSelected = selectedCategory === cat.slug;

              return (
                <label
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span>{pickLocalized(cat.name, language)}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Iraqi Governorates Filter (Dynamic - Zero Hardcoding) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('governorateLabel')}</label>
          <select
            value={selectedGov}
            onChange={(e) => setSelectedGov(e.target.value)}
            className="w-full text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 cursor-pointer focus:outline-blue-600"
          >
            <option value="all">{t('allGovernorates')}</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {pickLocalized(gov.name, language)} ({gov.region})
              </option>
            ))}
          </select>
        </div>

        {/* Accreditations (MoHESR / MoE / IB / Cambridge) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">{t('accreditation')}</label>
          <div className="space-y-2">
            {accreditations.map((acc) => {
              const isChecked = selectedAccreditations.includes(acc.id);
              return (
                <label
                  key={acc.id}
                  onClick={() => toggleAccreditation(acc.id)}
                  className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3 h-3" />}
                  </div>
                  <span>{pickLocalized(acc.name, language)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Curriculum (Iraqi / British / American / etc.) */}
        {curricula.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">{t('curriculum')}</label>
            <div className="space-y-2">
              {curricula.map((curr) => {
                const isChecked = selectedCurricula.includes(curr.id);
                return (
                  <label
                    key={curr.id}
                    onClick={() => toggleCurriculum(curr.id)}
                    className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                      isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                    <span>{pickLocalized(curr.name, language)}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Verified Filter Toggle */}
        <div className="pt-3 border-t border-slate-100">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">{t('ministryVerified')}</span>
            </div>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {mobileFilterOpen && (
          <button
            onClick={() => setMobileFilterOpen(false)}
            className="w-full py-3 bg-[#0B192C] text-white rounded-xl text-xs font-bold mt-4"
          >
            {t('applyFilters')}
          </button>
        )}
      </div>
    </aside>
  );
}
