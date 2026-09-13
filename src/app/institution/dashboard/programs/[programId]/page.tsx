'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { getInstitutionById } from '@/core/services/institutionService';
import { getInstitutionAdmissionApplications } from '@/core/services/admissionService';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { AdmissionApplication, AdmissionApplicationStatus } from '@/core/types/admission';
import { resolveDownloadURL } from '@/core/firebase/storage';
import {
  ArrowRight, Phone, Mail, FileText, AlertCircle, ArrowUpDown,
} from 'lucide-react';
import { formatShortDate } from '@/lib/utils';

const STAGES: AdmissionApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'WAITLISTED', 'ACCEPTED', 'REJECTED'];

const STAGE_LABELS: Record<AdmissionApplicationStatus, { ar: string; en: string }> = {
  SUBMITTED: { ar: 'جديد', en: 'New' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn' },
};

const STAGE_STYLES: Record<AdmissionApplicationStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  WAITLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  WITHDRAWN: 'bg-slate-200 text-slate-600',
};

type SortKey = 'newest' | 'oldest' | 'name';

export default function ProgramApplicantsPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = use(params);
  const { language, t } = useLanguage();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [program, setProgram] = useState<InstitutionProgram | null>(null);
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<Record<string, string>>({});
  const [documentUrlsByApp, setDocumentUrlsByApp] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdmissionApplicationStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult();
        const institutionId = tokenResult.claims.institutionId as string | undefined;
        if (!institutionId) return;

        const [inst, allApps] = await Promise.all([
          getInstitutionById(institutionId),
          getInstitutionAdmissionApplications(institutionId),
        ]);

        const prog = inst?.programs?.find((p) => p.id === programId) || null;
        if (!inst || !prog) {
          setError(t('هذا البرنامج غير موجود أو لا تملك صلاحية الوصول إليه', 'This program was not found or you do not have access to it'));
          return;
        }

        const apps = allApps.filter((a) => a.programId === programId);
        setInstitution(inst);
        setProgram(prog);
        setApplications(apps);
        const notes: Record<string, string> = {};
        for (const a of apps) notes[a.id] = a.decisionNote || '';
        setNotesDrafts(notes);

        // documentUrls on the doc are storage paths, not URLs — the student who uploaded them has
        // no read access, only write. The institution does, so resolve them here.
        const withDocs = apps.filter((a) => a.documentUrls?.length);
        const resolvedByApp = await Promise.all(
          withDocs.map((a) => Promise.all((a.documentUrls || []).map((p) => resolveDownloadURL(p).catch(() => null))))
        );
        const urlMap: Record<string, string[]> = {};
        withDocs.forEach((a, i) => {
          urlMap[a.id] = resolvedByApp[i].filter((u): u is string => !!u);
        });
        setDocumentUrlsByApp(urlMap);
      } catch {
        setError(t('تعذر تحميل بيانات المتقدمين', 'Failed to load applicant data'));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const handleDecision = async (applicationId: string, status: AdmissionApplicationStatus, decisionNote?: string) => {
    setDecidingId(applicationId);
    setDecisionError((prev) => ({ ...prev, [applicationId]: '' }));
    try {
      const res = await fetch(`/api/institution/admission-applications/${applicationId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...(decisionNote !== undefined && { decisionNote }) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDecisionError((prev) => ({ ...prev, [applicationId]: data.error || t('تعذر تحديث الطلب', 'Failed to update application') }));
        return;
      }
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? data.application : a)));
      setProgram((prev) => {
        if (!prev) return prev;
        const wasAccepted = applications.find((a) => a.id === applicationId)?.status === 'ACCEPTED';
        const becomingAccepted = status === 'ACCEPTED';
        if (wasAccepted === becomingAccepted) return prev;
        return { ...prev, acceptedCount: Math.max(0, (prev.acceptedCount || 0) + (becomingAccepted ? 1 : -1)) };
      });
    } finally {
      setDecidingId(null);
    }
  };

  const handleSaveNotes = (applicationId: string) => {
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return;
    handleDecision(applicationId, application.status, notesDrafts[applicationId] || '');
  };

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  if (error || !institution || !program) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const filtered = statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
    if (sortBy === 'oldest') return a.createdAt.localeCompare(b.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/institution/dashboard" className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2">
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('العودة للوحة التحكم', 'Back to dashboard')}</span>
        </Link>
        <h1 className="text-xl font-extrabold text-[#0B192C]">{language === 'en' ? program.name.en : program.name.ar}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {applications.length} {t('طلب تقديم', 'applications')}
          {program.capacity != null && (
            <span> • {program.acceptedCount || 0} / {program.capacity} {t('مقعد مقبول', 'seats accepted')}</span>
          )}
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AdmissionApplicationStatus | 'all')}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
          >
            <option value="all">{t('كافة الحالات', 'All Statuses')}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{language === 'en' ? STAGE_LABELS[s].en : STAGE_LABELS[s].ar}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-bold">
            {t('النتائج:', 'Results:')} <span className="text-slate-900 font-black">{sorted.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold">{t('الترتيب:', 'Sort:')}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
          >
            <option value="newest">{t('الأحدث', 'Newest')}</option>
            <option value="oldest">{t('الأقدم', 'Oldest')}</option>
            <option value="name">{t('الاسم', 'Name')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-start">{t('المتقدم', 'Applicant')}</th>
                <th className="p-3 text-start">{t('المستمسكات', 'Documents')}</th>
                <th className="p-3 text-start">{t('الحالة', 'Status')}</th>
                <th className="p-3 text-start">{t('تاريخ التقديم', 'Applied')}</th>
                <th className="p-3 text-end">{t('التفاصيل', 'Details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">{t('لا يوجد متقدمون بهذه الحالة', 'No applicants match this filter')}</td>
                </tr>
              ) : (
                sorted.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{app.studentName}</div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono mt-0.5" dir="ltr">
                          <Phone className="w-3 h-3" />
                          <span>{app.studentPhone}</span>
                        </div>
                        {app.studentEmail && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                            <Mail className="w-3 h-3" />
                            <span>{app.studentEmail}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {app.documentUrls?.length ? (
                          <div className="flex flex-col gap-1">
                            {app.documentUrls.map((_, i) => (
                              <a
                                key={i}
                                href={documentUrlsByApp[app.id]?.[i] || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-blue-700 hover:underline font-bold w-fit"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{documentUrlsByApp[app.id]?.[i] ? t(`مستند ${i + 1}`, `Document ${i + 1}`) : t('جاري التحميل...', 'Loading...')}</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {app.status === 'WITHDRAWN' ? (
                          <span className={`text-[11px] px-2 py-1 rounded-full font-bold ${STAGE_STYLES.WITHDRAWN}`}>
                            {language === 'en' ? STAGE_LABELS.WITHDRAWN.en : STAGE_LABELS.WITHDRAWN.ar}
                          </span>
                        ) : (
                          <select
                            value={app.status}
                            disabled={decidingId === app.id}
                            onChange={(e) => handleDecision(app.id, e.target.value as AdmissionApplicationStatus)}
                            className={`text-[11px] px-2 py-1 rounded-full font-bold border-0 cursor-pointer disabled:opacity-60 ${STAGE_STYLES[app.status]}`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>{language === 'en' ? STAGE_LABELS[s].en : STAGE_LABELS[s].ar}</option>
                            ))}
                          </select>
                        )}
                        {decisionError[app.id] && <p className="text-[10px] font-bold text-rose-600 mt-1 max-w-[160px]">{decisionError[app.id]}</p>}
                      </td>
                      <td className="p-3 text-slate-500">{formatShortDate(app.createdAt, language)}</td>
                      <td className="p-3 text-end">
                        <button
                          onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                          className="text-blue-700 hover:underline font-bold"
                        >
                          {expandedId === app.id ? t('إخفاء', 'Hide') : t('عرض', 'Show')}
                        </button>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-slate-50 space-y-3">
                          {app.message && (
                            <div>
                              <h4 className="font-bold text-slate-700 mb-1">{t('رسالة المتقدم', 'Applicant Statement')}</h4>
                              <p className="text-slate-600 whitespace-pre-line">{app.message}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-700 mb-1">{t('ملاحظة القرار (تظهر للطالب)', "Decision Note (visible to the student)")}</h4>
                            <textarea
                              rows={3}
                              value={notesDrafts[app.id] || ''}
                              onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              onBlur={() => handleSaveNotes(app.id)}
                              placeholder={t('اكتب ملاحظة للطالب حول هذا القرار...', 'Write a note to the student about this decision...')}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none bg-white"
                            />
                            {decidingId === app.id && <span className="text-slate-400">{t('جاري الحفظ...', 'Saving...')}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
