'use client';

import React from 'react';
import Link from 'next/link';
import { useT } from '@/lib/useT';
import { Plus, RefreshCw, Users } from 'lucide-react';
import { COMMUNITY_COPY } from '../Community.i18n';

export function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white rounded-2xl border border-[#E8E6DE] p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="space-y-1.5 flex-1">
              <div className="w-32 h-3.5 bg-slate-200 rounded-sm" />
              <div className="w-20 h-2.5 bg-slate-100 rounded-sm" />
            </div>
          </div>
          <div className="w-3/4 h-4 bg-slate-200 rounded-sm" />
          <div className="w-full h-12 bg-slate-100 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

export function FeedError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useT(COMMUNITY_COPY);

  return (
    <div className="bg-white p-12 rounded-2xl border border-rose-200 text-center space-y-4 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
        <RefreshCw className="w-6 h-6" />
      </div>
      <h3 className="font-extrabold text-base text-slate-800">{t('unavailable')}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#123D35] text-white rounded-xl text-xs font-bold hover:bg-[#28675A] transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>{t('tryAgain')}</span>
      </button>
    </div>
  );
}

export function FeedEmpty({
  searching,
  filtered,
  onClearFilters,
}: {
  searching: boolean;
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const t = useT(COMMUNITY_COPY);

  return (
    <div className="bg-white p-12 rounded-2xl border border-[#E8E6DE] text-center space-y-4 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#28675A] flex items-center justify-center mx-auto">
        <Users className="w-8 h-8" />
      </div>
      <h3 className="font-extrabold text-lg text-slate-900">
        {searching ? t('noMatch') : t('noneYet')}
      </h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
        {searching
          ? t('tryOther')
          : t('beFirstAsk')}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        {filtered && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            {t('clearFilters')}
          </button>
        )}
        <Link
          href="/community/new"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#123D35] hover:bg-[#28675A] text-white rounded-xl text-xs font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('askNow')}</span>
        </Link>
      </div>
    </div>
  );
}
