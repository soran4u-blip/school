'use client';

import React, { useEffect, useState } from 'react';
import { onIdTokenChanged } from 'firebase/auth';
import { ChevronDown, RotateCcw, Trash2 } from 'lucide-react';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { AdminListingType, eraseListing, restoreListing } from '@/core/services/adminListingService';
import { DELETED_LISTING_RETENTION_DAYS, purgeDate } from '@/lib/listingLifecycle';
import { useT } from '@/lib/useT';
import { intlLocale } from '@/lib/locales';
import { DELETED_LISTINGS_COPY } from './SharedPanels.i18n';

// The recycle bin under each admin directory list (institutions, tutors, employers).
//
// Deleting a listing only hides it — see core/types/softDelete.ts — so this is where it can be
// brought back, or erased before the purge task gets to it. Collapsed by default: it's a recovery
// tool, not something an admin works in day to day.

export interface DeletedListingRow {
  id: string;
  name: string;
  deletedAt?: string;
}

export default function DeletedListingsPanel({
  type,
  items,
  onChanged,
}: {
  type: AdminListingType;
  items: DeletedListingRow[];
  onChanged: () => Promise<void>;
}) {
  const { language } = useLanguage();
  const t = useT(DELETED_LISTINGS_COPY);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Presentation only: the erase endpoint refuses anyone else regardless.
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    return onIdTokenChanged(auth, async (user) => {
      const token = await user?.getIdTokenResult();
      setIsSuperadmin(token?.claims.role === 'superadmin');
    });
  }, []);

  if (items.length === 0) return null;

  const run = async (id: string, action: () => Promise<void>) => {
    setError('');
    setBusyId(id);
    try {
      await action();
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('actionFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleErase = (row: DeletedListingRow) => {
    if (!confirm(t('confirmErase', { name: row.name }))) return;
    run(row.id, () => eraseListing(type, row.id));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(language === 'en' ? 'en-GB' : intlLocale(language), { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-start"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Trash2 className="w-4 h-4 text-slate-400" />
          {t('deleted')}
          <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </span>
        <span className="flex items-center gap-2 text-[11px] text-slate-500">
          {t('restorable', { days: DELETED_LISTING_RETENTION_DAYS })}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {error && (
            <div className="m-4 p-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
          )}
          <ul className="divide-y divide-slate-100">
            {items.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{row.name}</div>
                  {row.deletedAt && (
                    <div className="text-[11px] text-slate-500">
                      {t('deletedOn')} {formatDate(row.deletedAt)} · {t('erasedOn')} {formatDate(purgeDate(row.deletedAt).toISOString())}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => run(row.id, () => restoreListing(type, row.id))}
                    disabled={busyId === row.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('restore')}
                  </button>
                  {isSuperadmin && (
                    <button
                      type="button"
                      onClick={() => handleErase(row)}
                      disabled={busyId === row.id}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-rose-700 border border-rose-200 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('eraseNow')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
