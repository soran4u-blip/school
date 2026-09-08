'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getPendingApplications, getApplicationsPage, approveApplication, rejectApplication } from '@/core/services/applicationService';
import { getGovernorates } from '@/core/services/masterDataService';
import { Application } from '@/core/types/application';
import { Governorate } from '@/core/types/masterData';
import { FileCheck2, Check, X, Phone, Mail, AlertCircle, Copy } from 'lucide-react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

const HISTORY_PAGE_SIZE = 25;

export default function AdminApplicationsPage() {
  const { language, t } = useLanguage();
  const [pending, setPending] = useState<Application[]>([]);
  const [history, setHistory] = useState<Application[]>([]);
  const [historyCursor, setHistoryCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<{ email: string; link: string } | null>(null);

  // Reloads the action queue (small, always full) and resets the history list back to its first
  // page — used on mount and after any decision, since a decision can move an item between the
  // two lists.
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [pendingApps, historyPage, govs] = await Promise.all([
        getPendingApplications(),
        getApplicationsPage(HISTORY_PAGE_SIZE),
        getGovernorates(false),
      ]);
      setPending(pendingApps);
      setHistory(historyPage.items);
      setHistoryCursor(historyPage.lastDoc);
      setHasMoreHistory(historyPage.hasMore);
      setGovernorates(govs);
    } catch {
      setError(t('تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', 'Failed to load data. Make sure you are signed in as superadmin.'));
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!historyCursor) return;
    setLoadingMore(true);
    try {
      const nextPage = await getApplicationsPage(HISTORY_PAGE_SIZE, historyCursor);
      setHistory((prev) => [...prev, ...nextPage.items]);
      setHistoryCursor(nextPage.lastDoc);
      setHasMoreHistory(nextPage.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const governorateName = (id: string) => {
    const gov = governorates.find((g) => g.id === id);
    return gov ? (language === 'en' ? gov.name.en : gov.name.ar) : id;
  };

  const handleApprove = async (app: Application) => {
    setBusyId(app.id);
    setError('');
    try {
      const result = await approveApplication(app.id);
      if (result.resetLink) {
        setResetLink({ email: app.email, link: result.resetLink });
      } else if (result.note) {
        alert(result.note);
      }
      await loadData();
    } catch (err: any) {
      setError(err.message || t('تعذرت الموافقة على الطلب', 'Failed to approve application'));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (app: Application) => {
    const reason = window.prompt(t('سبب الرفض (اختياري)', 'Rejection reason (optional)')) || undefined;
    setBusyId(app.id);
    try {
      await rejectApplication(app.id, reason);
      await loadData();
    } finally {
      setBusyId(null);
    }
  };

  // The paginated history page is ordered purely by date and may include PENDING/APPROVING rows
  // already shown above in the always-full pending queue — drop them here to avoid duplicates.
  const resolved = history.filter((a) => a.status !== 'PENDING' && a.status !== 'APPROVING');

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-blue-600" />
          <span>{t('طلبات الانضمام', 'Join Applications')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('راجع طلبات الانضمام من الأساتذة والمؤسسات. الموافقة على أستاذ تنشئ له حساب دخول تلقائياً.', 'Review applications from prospective tutors and institutions. Approving a tutor automatically provisions their login.')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {resetLink && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
          <p className="text-xs font-bold text-emerald-800">
            {t(`تم إنشاء الحساب لـ ${resetLink.email}. شارك رابط تعيين كلمة المرور معه:`, `Account created for ${resetLink.email}. Share this password-setup link with them:`)}
          </p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={resetLink.link}
              className="flex-1 px-3 py-2 rounded-lg border border-emerald-300 text-xs bg-white"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={() => navigator.clipboard.writeText(resetLink.link)}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              title={t('نسخ', 'Copy')}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setResetLink(null)} className="text-xs font-bold text-emerald-700 hover:underline">
            {t('إغلاق', 'Dismiss')}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('جاري التحميل...', 'Loading...')}</div>
        ) : pending.length === 0 && resolved.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد طلبات بعد', 'No applications yet')}</div>
        ) : (
          [...pending, ...resolved].map((app) => (
            <div key={app.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{app.fullName}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    app.type === 'TUTOR' ? 'bg-blue-50 text-blue-700' : app.type === 'INSTITUTION' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {app.type === 'TUTOR' ? t('أستاذ', 'Tutor') : app.type === 'INSTITUTION' ? t('مؤسسة', 'Institution') : t('شركة/منظمة', 'Company/NGO')}
                  </span>
                  <span className="text-[10px] text-slate-400">{governorateName(app.governorateId)}</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    app.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                    app.status === 'APPROVING' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {app.status === 'APPROVING' ? t('قيد المعالجة - أعد المحاولة', 'Stuck mid-approval — retry') : app.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                  <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{app.phone}</span>
                  {app.type === 'TUTOR' && app.yearsOfExperience !== undefined && (
                    <span>{t(`${app.yearsOfExperience} سنوات خبرة`, `${app.yearsOfExperience} yrs experience`)}</span>
                  )}
                </div>
                {app.message && <p className="text-xs text-slate-600">{app.message}</p>}
                {app.rejectionReason && (
                  <p className="text-[11px] text-rose-600 font-semibold">{t('سبب الرفض: ', 'Reason: ')}{app.rejectionReason}</p>
                )}
              </div>

              {(app.status === 'PENDING' || app.status === 'APPROVING') && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={busyId === app.id}
                    onClick={() => handleApprove(app)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg disabled:opacity-50"
                    title={app.status === 'APPROVING' ? t('إعادة المحاولة', 'Retry') : t('قبول', 'Approve')}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  {app.status === 'PENDING' && (
                    <button
                      disabled={busyId === app.id}
                      onClick={() => handleReject(app)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg disabled:opacity-50"
                      title={t('رفض', 'Reject')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {hasMoreHistory && (
        <div className="text-center">
          <button
            onClick={loadMoreHistory}
            disabled={loadingMore}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {loadingMore ? t('جاري التحميل...', 'Loading...') : t('تحميل المزيد', 'Load more')}
          </button>
        </div>
      )}
    </div>
  );
}
