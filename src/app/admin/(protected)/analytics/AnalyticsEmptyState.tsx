'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/core/context/LanguageContext';
import { RefreshCw } from 'lucide-react';

// Shown before the analytics task has ever run — on a fresh deploy, or before the schedule is
// wired up. Offers the same recompute the scheduled task performs rather than silently rendering
// a page full of zeroes, which would read as real data.
export default function AnalyticsEmptyState() {
  const { t } = useLanguage();
  const router = useRouter();
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState('');

  const handleRecompute = async () => {
    setRecomputing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/analytics/recompute', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Recompute failed');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('تعذر حساب التحليلات', 'Could not compute analytics'));
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('التحليلات', 'Analytics')}</h1>
      <p className="text-sm text-slate-500">
        {t(
          'لم يتم حساب التحليلات بعد. تُحسب تلقائياً حسب جدول زمني، ويمكنك حسابها الآن.',
          'Analytics have not been computed yet. They are produced on a schedule, or you can compute them now.'
        )}
      </p>
      {error && <div className="p-3 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>}
      <button
        onClick={handleRecompute}
        disabled={recomputing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#0B192C] hover:bg-[#1E3E62] text-white disabled:opacity-60"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
        <span>{recomputing ? t('جاري الحساب...', 'Computing...') : t('احسب الآن', 'Compute now')}</span>
      </button>
    </div>
  );
}
