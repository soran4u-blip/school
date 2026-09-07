'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { getEmployerById } from '@/core/services/employerService';
import { getGovernorates } from '@/core/services/masterDataService';
import { getEmployerJobs, getEmployerJobApplications, updateJob, createJob } from '@/core/services/jobService';
import { Employer } from '@/core/types/employer';
import { Job } from '@/core/types/job';
import { Governorate } from '@/core/types/masterData';
import {
  Briefcase, Plus, Users, ExternalLink, AlertCircle,
} from 'lucide-react';

const EMPLOYMENT_LABELS: Record<Job['employmentType'], { ar: string; en: string }> = {
  FULL_TIME: { ar: 'دوام كامل', en: 'Full-time' },
  PART_TIME: { ar: 'دوام جزئي', en: 'Part-time' },
  CONTRACT: { ar: 'عقد', en: 'Contract' },
  INTERNSHIP: { ar: 'تدريب', en: 'Internship' },
};

function emptyJob(employerId: string): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    employerId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    employmentType: 'FULL_TIME',
    governorateId: '',
    isRemote: false,
    status: 'DRAFT',
  };
}

export default function EmployerDashboardPage() {
  const { language, t } = useLanguage();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicationCounts, setJobApplicationCounts] = useState<Record<string, number>>({});
  const [editingJob, setEditingJob] = useState<Job | Omit<Job, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [savingJob, setSavingJob] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult();
        const id = tokenResult.claims.employerId as string | undefined;
        if (!id) return;

        const [emp, govs, empJobs, empApplications] = await Promise.all([
          getEmployerById(id),
          getGovernorates(false),
          getEmployerJobs(id),
          getEmployerJobApplications(id),
        ]);
        setEmployer(emp);
        setGovernorates(govs);
        setJobs(empJobs);
        const counts: Record<string, number> = {};
        for (const app of empApplications) counts[app.jobId] = (counts[app.jobId] || 0) + 1;
        setJobApplicationCounts(counts);
      } catch {
        setMessage({ text: t('تعذر تحميل بيانات لوحة التحكم', 'Failed to load dashboard data'), type: 'error' });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [t]);

  const handleSaveJob = async () => {
    if (!editingJob || !employer) return;
    setSavingJob(true);
    try {
      if ('id' in editingJob) {
        await updateJob(editingJob.id, editingJob);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...editingJob } : j)));
      } else {
        const created = await createJob({
          ...editingJob,
          posterName: employer.name,
          posterLogoUrl: employer.logoUrl,
          posterType: employer.type,
        });
        setJobs((prev) => [created, ...prev]);
      }
      setEditingJob(null);
      setMessage({ text: t('تم حفظ الوظيفة بنجاح', 'Job saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ الوظيفة', 'Failed to save the job'), type: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const handleJobStatus = async (jobId: string, status: Job['status']) => {
    await updateJob(jobId, { status });
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  if (!employer) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{t('تعذر العثور على حساب الشركة/المنظمة', 'Could not find your employer account')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">{employer.name}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('انشر الوظائف والتدريب المهني وأدر المتقدمين', 'Post jobs and internships, and manage applicants')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-orange-600" />
            <span>{t('الوظائف الشاغرة', 'Job Postings')}</span>
          </h2>
          {!editingJob && (
            <button
              onClick={() => setEditingJob(emptyJob(employer.id))}
              className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('نشر وظيفة جديدة', 'Post a Job')}</span>
            </button>
          )}
        </div>

        {editingJob && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={t('المسمى الوظيفي (عربي)', 'Job title (Arabic)')}
                value={editingJob.title.ar}
                onChange={(e) => setEditingJob({ ...editingJob, title: { ...editingJob.title, ar: e.target.value } })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                placeholder={t('المسمى الوظيفي (إنجليزي)', 'Job title (English)')}
                value={editingJob.title.en}
                onChange={(e) => setEditingJob({ ...editingJob, title: { ...editingJob.title, en: e.target.value } })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <textarea
                rows={3}
                placeholder={t('الوصف الوظيفي (عربي)', 'Description (Arabic)')}
                value={editingJob.description.ar}
                onChange={(e) => setEditingJob({ ...editingJob, description: { ...editingJob.description, ar: e.target.value } })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
              />
              <textarea
                rows={3}
                placeholder={t('الوصف الوظيفي (إنجليزي)', 'Description (English)')}
                value={editingJob.description.en}
                onChange={(e) => setEditingJob({ ...editingJob, description: { ...editingJob.description, en: e.target.value } })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg resize-none"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={editingJob.employmentType}
                onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value as Job['employmentType'] })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                {(Object.keys(EMPLOYMENT_LABELS) as Job['employmentType'][]).map((key) => (
                  <option key={key} value={key}>{language === 'en' ? EMPLOYMENT_LABELS[key].en : EMPLOYMENT_LABELS[key].ar}</option>
                ))}
              </select>
              <select
                value={editingJob.governorateId}
                onChange={(e) => setEditingJob({ ...editingJob, governorateId: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              >
                <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                {governorates.map((g) => (
                  <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
                ))}
              </select>
              <input
                type="date"
                value={editingJob.applicationDeadline || ''}
                onChange={(e) => setEditingJob({ ...editingJob, applicationDeadline: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={editingJob.isRemote}
                  onChange={(e) => setEditingJob({ ...editingJob, isRemote: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span>{t('عن بُعد', 'Remote')}</span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingJob(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSaveJob}
                disabled={savingJob || !editingJob.title.ar.trim() || !editingJob.title.en.trim() || !editingJob.governorateId}
                className="px-4 py-2 text-xs font-bold bg-[#0B192C] text-white rounded-lg disabled:opacity-60"
              >
                {savingJob ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
              </button>
            </div>
          </div>
        )}

        {jobs.length === 0 ? (
          <p className="text-[11px] text-slate-400">{t('لم تنشر أي وظيفة بعد', 'No jobs posted yet')}</p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div key={job.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">{language === 'en' ? job.title.en : job.title.ar}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : job.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold mt-1">
                    <Users className="w-3 h-3" />
                    <span>{jobApplicationCounts[job.id] || 0} {t('متقدم', 'applicants')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/employer/dashboard/jobs/${job.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('المتقدمون', 'Applicants')}</span>
                  </Link>
                  <button
                    onClick={() => setEditingJob(job)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold"
                  >
                    {t('تعديل', 'Edit')}
                  </button>
                  {job.status === 'ACTIVE' ? (
                    <button onClick={() => handleJobStatus(job.id, 'CLOSED')} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold">
                      {t('إغلاق', 'Close')}
                    </button>
                  ) : (
                    <button onClick={() => handleJobStatus(job.id, 'ACTIVE')} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold">
                      {t('نشر', 'Publish')}
                    </button>
                  )}
                  <a href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-slate-700">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
