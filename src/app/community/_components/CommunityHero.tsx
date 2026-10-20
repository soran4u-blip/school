'use client';

import React from 'react';
import Link from 'next/link';
import { useT } from '@/lib/useT';
import { Plus, Search, Sparkles, X } from 'lucide-react';
import { COMMUNITY_COPY } from '../Community.i18n';

// Breadcrumb, headline, "ask" button and the community search box.
export default function CommunityHero({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}) {
  const t = useT(COMMUNITY_COPY);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#123D35] via-[#174A40] to-[#28675A] text-white pt-7 pb-9 sm:pt-9 sm:pb-11 px-4 sm:px-6 lg:px-8 border-b border-white/10">
      {/* Subtle decorative background glowing orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D9F27C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-5">
        {/* Breadcrumb & Community Tag */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
          <span className="text-slate-400">{t('home')}</span>
          <span className="text-slate-600">/</span>
          <span className="text-[#D9F27C] font-bold">{t('crumbDirectory')}</span>
          <span className="text-slate-600">/</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[#D9F27C] text-[11px] font-extrabold tracking-wide">
            <Sparkles className="w-3 h-3" />
            <span>{t('forumTag')}</span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              {t('heroIntro')}
            </p>
          </div>

          {/* Quick Action Button in Hero */}
          <div className="shrink-0 flex items-center gap-3">
            <Link
              href="/community/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#123D35] font-extrabold text-sm shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 transition-all transform active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{t('askQuestion')}</span>
            </Link>
          </div>
        </div>

        {/* Integrated Community Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/15 shadow-xl flex items-center gap-2">
            <div className="ps-3 text-slate-300">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              aria-label={t('searchAria')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm focus:outline-hidden py-2"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('clearSearch')}
                className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                title={t('clear')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
