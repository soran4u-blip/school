'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { AuditLogEntry, AuditAction } from '@/core/types/auditLog';
import { ScrollText, User, Bot, ChevronDown } from 'lucide-react';

// Renders the audit trail. The first page is server-rendered; this only handles paging.

const ACTION_STYLES: Record<AuditAction, string> = {
  'application.approve': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'application.reject': 'bg-rose-50 text-rose-700 border-rose-200',
  'review.moderate': 'bg-blue-50 text-blue-700 border-blue-200',
  'review.delete': 'bg-rose-50 text-rose-700 border-rose-200',
  'listing.status': 'bg-amber-50 text-amber-700 border-amber-200',
  'listing.verify': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'listing.feature': 'bg-purple-50 text-purple-700 border-purple-200',
  'listing.delete': 'bg-rose-50 text-rose-700 border-rose-200',
  'listing.restore': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'listing.purge': 'bg-rose-100 text-rose-800 border-rose-300',
  'inquiry.update': 'bg-blue-50 text-blue-700 border-blue-200',
  'tutor.verification.approve': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'tutor.verification.reject': 'bg-rose-50 text-rose-700 border-rose-200',
  'settings.update': 'bg-amber-50 text-amber-700 border-amber-200',
  'analytics.recompute': 'bg-slate-100 text-slate-600 border-slate-200',
  'counters.repair': 'bg-slate-100 text-slate-600 border-slate-200',
  'database.seed': 'bg-rose-50 text-rose-700 border-rose-200',
  'task.run': 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AuditLogView({
  initialItems,
  initialCursor,
}: {
  initialItems: AuditLogEntry[];
  initialCursor: string | null;
}) {
  const { language, t } = useLanguage();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/audit?cursor=${encodeURIComponent(cursor)}`);
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || 'Could not load more');
      setItems((prev) => [...prev, ...body.items]);
      setCursor(body.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('تعذر تحميل المزيد', 'Could not load more'));
    } finally {
      setLoading(false);
    }
  };

  const when = (iso: string) =>
    new Date(iso).toLocaleString(language === 'en' ? 'en-GB' : 'ar', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-slate-700" />
          <span>{t('سجل الإجراءات', 'Audit Log')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t(
            'كل إجراء إداري حساس: الاعتماد، التوثيق، الإبراز، الإيقاف، والحذف — ومن نفّذه.',
            'Every privileged action — approving, verifying, featuring, suspending, deleting — and who performed it.'
          )}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">{error}</div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center text-xs text-slate-400">
          {t('لا توجد إجراءات مسجلة بعد', 'No recorded actions yet')}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {items.map((entry) => (
            <div key={entry.id} className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                {entry.actorUid === 'system' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ACTION_STYLES[entry.action] || 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {entry.action}
                  </span>
                  <span className="text-[11px] text-slate-400">{when(entry.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-800 font-medium break-words">{entry.summary}</p>
                <p className="text-[11px] text-slate-400 break-all">
                  {entry.actorUid === 'system' ? t('النظام (مهمة مجدولة)', 'System (scheduled task)') : entry.actorUid}
                  {entry.ip ? ` · ${entry.ip}` : ''}
                  {entry.targetId ? ` · ${entry.targetType}/${entry.targetId}` : ''}
                </p>
                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <p className="text-[11px] text-slate-400 break-all">
                    {Object.entries(entry.metadata)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(' · ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>{loading ? t('جاري التحميل...', 'Loading...') : t('تحميل المزيد', 'Load more')}</span>
        </button>
      )}
    </div>
  );
}
