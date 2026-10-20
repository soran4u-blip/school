'use client';

import React from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { Governorate } from '@/core/types/masterData';
import { Bookmark, Clock, Flame, HelpCircle, MapPin, X } from 'lucide-react';
import { COMMUNITY_COPY } from '../Community.i18n';

export type CommunityTab = 'all' | 'hot' | 'latest' | 'unanswered' | 'saved';

// Tab bar, governorate chips and the "active filters" banner above the feed.
export default function CommunityFilters({
  activeTab,
  setActiveTab,
  totalCount,
  savedCount,
  shownCount,
  selectedGov,
  setSelectedGov,
  activeGovernorates,
  govCounts,
  searchQuery,
  setSearchQuery,
}: {
  activeTab: CommunityTab;
  setActiveTab: (tab: CommunityTab) => void;
  totalCount: number;
  savedCount: number;
  shownCount: number;
  selectedGov: string;
  setSelectedGov: (id: string) => void;
  activeGovernorates: Governorate[];
  govCounts: Record<string, number>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}) {
  const { language } = useLanguage();
  const t = useT(COMMUNITY_COPY);

  return (
    <>
      {/* Filter Tabs & Governorate Chips */}
      <div className="space-y-4">
        {/* Tab Navigation (All, Hot, Latest, Unanswered) */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8E6DE] bg-white p-2 sm:p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              aria-pressed={activeTab === 'all'}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#123D35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{t('tabAll')}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hot')}
              aria-pressed={activeTab === 'hot'}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'hot'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{t('tabHot')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('latest')}
              aria-pressed={activeTab === 'latest'}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'latest'
                  ? 'bg-[#123D35] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{t('tabLatest')}</span>
            </button>

            <button type="button" onClick={() => setActiveTab('saved')} aria-pressed={activeTab === 'saved'} className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'saved' ? 'bg-[#123D35] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Bookmark className="w-3.5 h-3.5" /><span>{t('tabSaved')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>{savedCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unanswered')}
              aria-pressed={activeTab === 'unanswered'}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'unanswered'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('tabUnanswered')}</span>
            </button>
          </div>

          {/* Counter indicator */}
          <div className="text-[11px] sm:text-xs font-semibold text-slate-400 shrink-0 ms-auto">
            {t('showingCount', { n: shownCount })}
          </div>
        </div>

        {/* Governorate Filter Chips (Horizontal Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedGov('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border ${
              selectedGov === 'all'
                ? 'bg-[#123D35] text-white border-[#123D35] shadow-sm'
                : 'bg-white text-slate-700 border-[#E8E6DE] hover:border-slate-300'
            }`}
          >
            {t('allGovernorates')}
          </button>

          {activeGovernorates.map((gov) => {
            const count = govCounts[gov.id] || 0;
            const isSelected = selectedGov === gov.id;
            const govName = pickLocalized(gov.name, language);

            return (
              <button
                key={gov.id}
                type="button"
                onClick={() => setSelectedGov(gov.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#123D35] text-white border-[#123D35] shadow-sm'
                    : 'bg-white text-slate-700 border-[#E8E6DE] hover:border-slate-300'
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-[#D9F27C]' : 'text-slate-400'}`} />
                <span>{govName}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Search / Filter Banner */}
      {(searchQuery || selectedGov !== 'all' || activeTab !== 'all') && (
        <div className="bg-emerald-50/70 border border-[#D5E3DC] rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold">{t('activeFilters')}</span>
            {selectedGov !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                {pickLocalized(activeGovernorates.find((g) => g.id === selectedGov)?.name, language) || selectedGov}
                <button onClick={() => setSelectedGov('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeTab !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-[#D5E3DC] font-bold">
                {activeTab === 'hot' && t('filterHot')}
                {activeTab === 'latest' && t('tabLatest')}
                {activeTab === 'unanswered' && t('filterUnanswered')}
                {activeTab === 'saved' && t('tabSaved')}
                <button onClick={() => setActiveTab('all')} className="hover:text-rose-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedGov('all');
              setSearchQuery('');
              setActiveTab('all');
            }}
            className="text-[#28675A] hover:text-emerald-900 font-bold underline shrink-0"
          >
            {t('resetFilters')}
          </button>
        </div>
      )}
    </>
  );
}
