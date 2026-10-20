'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { getJobById, getInstitutionJobApplications, updateJobApplicationStatus, updateJobApplicationNotes } from '@/core/services/jobService';
import { Job, JobApplication } from '@/core/types/job';
import { resolveDownloadURL } from '@/core/firebase/storage';
import {
  ArrowRight, Phone, FileText, AlertCircle, ArrowUpDown,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { APPLICANTS_COPY } from '../../InstitutionApplicants.i18n';

const STAGES: JobApplication['status'][] = ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const STAGE_LABELS: Record<JobApplication['status'], { ar: string; en: string; ku: string }> = {
  SUBMITTED: { ar: 'جديد', en: 'New', ku: 'نوێ' },
  REVIEWING: { ar: 'قيد المراجعة', en: 'Reviewing', ku: 'لە پێداچوونەوەدایە' },
  SHORTLISTED: { ar: 'القائمة المختصرة', en: 'Shortlisted', ku: 'لیستی کورت' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected', ku: 'ڕەتکراوە' },
  HIRED: { ar: 'تم التوظيف', en: 'Hired', ku: 'دامەزرا' },
};

const STAGE_STYLES: Record<JobApplication['status'], string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  REVIEWING: 'bg-amber-50 text-amber-700',
  SHORTLISTED: 'bg-purple-50 text-purple-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  HIRED: 'bg-emerald-50 text-emerald-700',
};

type SortKey = 'newest' | 'oldest' | 'name';

export default function JobApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { language } = useLanguage();
  const t = useT(APPLICANTS_COPY);

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [resumeDownloadUrls, setResumeDownloadUrls] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobApplication['status'] | 'all'>('all');
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

        const [jobDoc, allApps] = await Promise.all([
          getJobById(jobId),
          getInstitutionJobApplications(institutionId),
        ]);

        if (!jobDoc || jobDoc.institutionId !== institutionId) {
          setError(t('jobNotFound'));
          return;
        }

        const apps = allApps.filter((a) => a.jobId === jobId);
        setJob(jobDoc);
        setApplications(apps);
        const notes: Record<string, string> = {};
        for (const a of apps) notes[a.id] = a.internalNotes || '';
        setNotesDrafts(notes);

        // resumeUrl on the doc is a storage path, not a URL — the applicant who uploaded it had
        // no read access to resolve it themselves. The institution does, so resolve it here.
        const withResumes = apps.filter((a) => a.resumeUrl);
        const resolved = await Promise.all(withResumes.map((a) => resolveDownloadURL(a.resumeUrl!).catch(() => null)));
        const urls: Record<string, string> = {};
        withResumes.forEach((a, i) => { if (resolved[i]) urls[a.id] = resolved[i]!; });
        setResumeDownloadUrls(urls);
      } catch {
        setError(t('loadFailed'));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleMoveStage = async (applicationId: string, status: JobApplication['status']) => {
    await updateJobApplicationStatus(applicationId, status);
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  const handleSaveNotes = async (applicationId: string) => {
    setSavingNotesId(applicationId);
    try {
      await updateJobApplicationNotes(applicationId, notesDrafts[applicationId] || '');
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, internalNotes: notesDrafts[applicationId] } : a)));
    } finally {
      setSavingNotesId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('loading')}</div>;
  }

  if (error || !job) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  const filtered = statusFilter === 'all' ? applications : applications.filter((a) => a.status === statusFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
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
        <h1 className="text-xl font-extrabold text-[#0B192C]">{pickLocalized(job.title, language)}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('jobApplicationsCount', { n: applications.length })}</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as JobApplication['status'] | 'all')}
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
                <th className="p-3 text-start">{t('resume')}</th>
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
                        <div className="font-bold text-slate-900">{app.fullName}</div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono mt-0.5" dir="ltr">
                          <Phone className="w-3 h-3" />
                          <span>{app.phone}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {app.resumeUrl ? (
                          <a href={resumeDownloadUrls[app.id] || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-700 hover:underline font-bold w-fit">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{resumeDownloadUrls[app.id] ? t('view') : t('loading')}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={app.status}
                          onChange={(e) => handleMoveStage(app.id, e.target.value as JobApplication['status'])}
                          className={`text-[11px] px-2 py-1 rounded-full font-bold border-0 cursor-pointer ${STAGE_STYLES[app.status]}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{pickLocalized(STAGE_LABELS[s], language)}</option>
                          ))}
                        </select>
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
                          {app.coverLetter && (
                            <div>
                              <h4 className="font-bold text-slate-700 mb-1">{t('coverLetter')}</h4>
                              <p className="text-slate-600 whitespace-pre-line">{app.coverLetter}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-700 mb-1">{t('internalNote')}</h4>
                            <textarea
                              rows={3}
                              value={notesDrafts[app.id] || ''}
                              onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                              onBlur={() => handleSaveNotes(app.id)}
                              placeholder={t('internalNotePlaceholder')}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none bg-white"
                            />
                            {savingNotesId === app.id && <span className="text-slate-400">{t('saving')}</span>}
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
