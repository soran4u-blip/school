'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { getInstitutionById } from '@/core/services/institutionService';
import { getInstitutionAdmissionApplications } from '@/core/services/admissionService';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { AdmissionApplication, AdmissionApplicationStatus } from '@/core/types/admission';
import { resolveDownloadURL } from '@/core/firebase/storage';
import {
  ArrowRight, Phone, Mail, FileText, AlertCircle, ArrowUpDown,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { APPLICANTS_COPY } from '../../InstitutionApplicants.i18n';

const STAGES: AdmissionApplicationStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'WAITLISTED', 'ACCEPTED', 'REJECTED'];

const STAGE_LABELS: Record<AdmissionApplicationStatus, { ar: string; en: string; ku: string }> = {
  SUBMITTED: { ar: 'جديد', en: 'New', ku: 'نوێ' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review', ku: 'لە ژێر پێداچوونەوەدایە' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted', ku: 'لیستی چاوەڕوانی' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted', ku: 'وەرگیراو' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected', ku: 'ڕەتکراوە' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn', ku: 'کشاوەتەوە' },
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
  const { language } = useLanguage();
  const t = useT(APPLICANTS_COPY);

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
          setError(t('programNotFound'));
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
        setError(t('loadFailed'));
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
        setDecisionError((prev) => ({ ...prev, [applicationId]: data.error || t('updateFailed') }));
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
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('loading')}</div>;
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
          <span>{t('backToDashboard')}</span>
        </Link>
        <h1 className="text-xl font-extrabold text-[#0B192C]">{pickLocalized(program.name, language)}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('applicationsCount', { n: applications.length })}
          {program.capacity != null && (
            <span> • {t('seatsAccepted', { accepted: program.acceptedCount || 0, capacity: program.capacity })}</span>
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
            <option value="all">{t('allStatuses')}</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{pickLocalized(STAGE_LABELS[s], language)}</option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-bold">
            {t('results')} <span className="text-slate-900 font-black">{sorted.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold">{t('sort')}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 text-xs"
          >
            <option value="newest">{t('newest')}</option>
            <option value="oldest">{t('oldest')}</option>
            <option value="name">{t('name')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-start">{t('applicant')}</th>
                <th className="p-3 text-start">{t('documents')}</th>
                <th className="p-3 text-start">{t('status')}</th>
                <th className="p-3 text-start">{t('applied')}</th>
                <th className="p-3 text-end">{t('details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">{t('noMatch')}</td>
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
                                <span>{documentUrlsByApp[app.id]?.[i] ? t('documentN', { n: i + 1 }) : t('loading')}</span>
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
                            {pickLocalized(STAGE_LABELS.WITHDRAWN, language)}
                          </span>
                        ) : (
                          <select
                            value={app.status}
                            disabled={decidingId === app.id}
                            onChange={(e) => handleDecision(app.id, e.target.value as AdmissionApplicationStatus)}
                            className={`text-[11px] px-2 py-1 rounded-full font-bold border-0 cursor-pointer disabled:opacity-60 ${STAGE_STYLES[app.status]}`}
                          >
                            {STAGES.map((s) => (
                              <option key={s} value={s}>{pickLocalized(STAGE_LABELS[s], language)}</option>
                            ))}
                          </select>
                        )}
                        {decisionError[app.id] && <p className="text-[10px] font-bold text-rose-600 mt-1 max-w-[160px]">{decisionError[app.id]}</p>}
                      </td>
                      <td className="p-3 text-slate-500">{formatDate(app.createdAt, language)}</td>
                      <td className="p-3 text-end">
                        <button
                          onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                          className="text-blue-700 hover:underline font-bold"
                        >
                          {expandedId === app.id ? t('hide') : t('show')}
                        </button>
                      </td>
                    </tr>
                    {expandedId === app.id && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-slate-50 space-y-3">
                          {app.message && (
                            <div>
                              <h4 className="font-bold text-slate-700 mb-1">{t('applicantStatement')}</h4>
                              <p className="text-slate-600 whitespace-pre-line">{app.message}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-700 mb-1">{t('decisionNote')}</h4>
                            <textarea
                              rows={3}
                              value={notesDrafts[app.id] || ''}
                              onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              onBlur={() => handleSaveNotes(app.id)}
                              placeholder={t('decisionNotePlaceholder')}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none bg-white"
                            />
                            {decidingId === app.id && <span className="text-slate-400">{t('saving')}</span>}
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
