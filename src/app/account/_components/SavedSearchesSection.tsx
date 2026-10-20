'use client';

import React from 'react';
import Link from 'next/link';
import { SavedSearch } from '@/core/types/savedSearch';
import { Bookmark, X } from 'lucide-react';
import { useT } from '@/lib/useT';
import { ACCOUNT_COPY } from '../Account.i18n';

// The account page's saved-searches list — only rendered when the student has at least one.
export default function SavedSearchesSection({
  savedSearches,
  deletingSearchId,
  onDelete,
}: {
  savedSearches: SavedSearch[];
  deletingSearchId: string | null;
  onDelete: (id: string) => void;
}) {
  const t = useT(ACCOUNT_COPY);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      <h2 className="text-sm font-extrabold text-[#0B192C] flex items-center gap-2">
        <Bookmark className="w-4 h-4 text-blue-600" />
        {t('savedSearches')}
      </h2>
      <div className="space-y-2">
        {savedSearches.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <Link href={s.path} className="text-xs font-bold text-blue-700 hover:underline flex-1 truncate">
              {s.label}
            </Link>
            <button
              onClick={() => onDelete(s.id)}
              disabled={deletingSearchId === s.id}
              className="p-1.5 text-slate-300 hover:text-rose-600 disabled:opacity-60 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
