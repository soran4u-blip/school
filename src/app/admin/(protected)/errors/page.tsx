'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getRecentErrorLogs, deleteErrorLog } from '@/core/services/errorLogService';
import { ErrorLog } from '@/core/types/errorLog';
import { Bug, Trash2, Monitor, Server } from 'lucide-react';

export default function AdminErrorsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'client' | 'server'>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      setLogs(await getRecentErrorLogs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteErrorLog(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const filtered = sourceFilter === 'all' ? logs : logs.filter((l) => l.source === sourceFilter);

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#0B192C] flex items-center gap-2">
            <Bug className="w-5 h-5" />
            {t('أخطاء النظام', 'System Errors')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('آخر 200 خطأ من العميل والخادم — لا حاجة لخدمة مراقبة خارجية.', 'The last 200 client- and server-side errors — no third-party monitoring service required.')}
          </p>
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value as 'all' | 'client' | 'server')}
          className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="all">{t('الكل', 'All')}</option>
          <option value="client">{t('العميل', 'Client')}</option>
          <option value="server">{t('الخادم', 'Server')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-sm text-slate-400">
          {t('لا توجد أخطاء مسجلة', 'No errors logged')}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                {log.source === 'client' ? (
                  <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <Server className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className="flex-1 text-xs font-mono text-slate-800 truncate">{log.message}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.createdAt.slice(0, 19).replace('T', ' ')}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {expandedId === log.id && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-600">
                  {log.url && <div><span className="font-bold">URL:</span> <span className="font-mono">{log.url}</span></div>}
                  {log.userAgent && <div><span className="font-bold">User Agent:</span> {log.userAgent}</div>}
                  {log.role && <div><span className="font-bold">Role:</span> {log.role}</div>}
                  {log.stack && (
                    <pre className="mt-2 p-2 bg-white border border-slate-200 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">{log.stack}</pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
