'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircleQuestion, Search } from 'lucide-react';
import { useT } from '@/lib/useT';
import { EXPLORE_COPY } from '../Explore.i18n';

export default function EmptyResults({ onClearFilters }: { onClearFilters: () => void }) {
  const t = useT(EXPLORE_COPY);

  return (
    <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Search className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-extrabold text-base text-slate-800">
        {t('emptyTitle')}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        {t('emptyNote')}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button onClick={onClearFilters} className="px-4 py-2 bg-[#0B192C] text-white rounded-xl text-xs font-bold hover:bg-[#1E3E62] transition-colors">
          {t('emptyReset')}
        </button>
        <Link href="/community" className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-blue-200 hover:bg-blue-50 transition-colors">
          <MessageCircleQuestion className="h-3.5 w-3.5" aria-hidden="true" />
          {t('askCommunity')}
        </Link>
      </div>
    </div>
  );
}
