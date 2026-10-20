'use client';

import React from 'react';
import { ArrowUpDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { useT } from '@/lib/useT';
import { EXPLORE_COPY } from '../Explore.i18n';

export type SortOption = 'recommended' | 'rating' | 'tuition_asc' | 'reviews_desc' | 'distance_asc';

// The explore results column's header: the found-count + save-search action on the left, and the
// sort selector on the right. The parent owns the save-search handler (it needs auth state and
// the full filter snapshot) and the sort state.
export default function ResultsHeader({
  resultCount,
  onSaveSearch,
  savingSearch,
  searchSaved,
  sortBy,
  setSortBy,
  nearMeActive,
}: {
  resultCount: number;
  onSaveSearch: () => void;
  savingSearch: boolean;
  searchSaved: boolean;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  nearMeActive: boolean;
}) {
  const t = useT(EXPLORE_COPY);

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="text-xs font-bold text-slate-700">
          {t('found')}{' '}
          <span className="text-blue-700 font-black text-sm">{resultCount}</span>{' '}
          {t('foundListings')}
        </div>
        <button
          onClick={onSaveSearch}
          disabled={savingSearch || searchSaved}
          className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 disabled:opacity-60"
        >
          {searchSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          {searchSaved ? t('searchSaved') : t('saveSearch')}
        </button>
      </div>

      {/* Sort selector */}
      <div className="flex items-center gap-2 text-xs">
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500 font-semibold">{t('sort')}</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-pointer focus:outline-blue-600"
        >
          <option value="recommended">{t('sortRecommended')}</option>
          <option value="rating">{t('sortRating')}</option>
          <option value="reviews_desc">{t('sortReviews')}</option>
          <option value="tuition_asc">{t('sortTuition')}</option>
          {nearMeActive && <option value="distance_asc">{t('sortDistance')}</option>}
        </select>
      </div>
    </div>
  );
}
