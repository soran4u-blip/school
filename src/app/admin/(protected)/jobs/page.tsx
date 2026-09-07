'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/core/context/LanguageContext';
import { getAllJobs, getAllJobApplications } from '@/core/services/jobService';
import { Job } from '@/core/types/job';
import { Briefcase, Users, AlertCircle, ExternalLink } from 'lucide-react';

export default function AdminJobsPage() {
  const { language, t } = useLanguage();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [filterPoster, setFilterPoster] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [allJobs, allApplications] = await Promise.all([
          getAllJobs(),
          getAllJobApplications(),
        ]);
        setJobs(allJobs);
        const counts: Record<string, number> = {};
        for (const app of allApplications) counts[app.jobId] = (counts[app.jobId] || 0) + 1;
        setApplicationCounts(counts);
      } catch {
        setError(t('تعذر تحميل البيانات. تأكد من تسجيل الدخول كسوبر أدمن.', 'Failed to load data. Make sure you are signed in as superadmin.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [t]);

  const posterKey = (job: Job) => job.institutionId || job.employerId || job.id;
  const posters = Array.from(new Map(jobs.map((j) => [posterKey(j), j.posterName || posterKey(j)])).entries());

  const filtered = filterPoster === 'all' ? jobs : jobs.filter((j) => posterKey(j) === filterPoster);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C] flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          <span>{t('كافة الوظائف الشاغرة', 'All Job Postings')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('نظرة شاملة على وظائف كل المؤسسات والشركات والمنظمات على المنصة.', 'A platform-wide view across every institution, company, and NGO job posting.')}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <select
          value={filterPoster}
          onChange={(e) => setFilterPoster(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
        >
          <option value="all">{t('كافة الجهات', 'All Posters')}</option>
          {posters.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <span className="text-xs text-slate-500 font-bold">
          {t('النتائج:', 'Results:')} <span className="text-slate-900 font-black">{filtered.length}</span>
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('جاري التحميل...', 'Loading...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد وظائف بعد', 'No jobs yet')}</div>
        ) : (
          filtered.map((job) => (
            <div key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900">{language === 'en' ? job.title.en : job.title.ar}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : job.status === 'DRAFT' ? 'bg-amber-50 text-amber-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {job.status}
                  </span>
                  {job.employerId && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                      {job.posterType === 'NGO' ? t('منظمة', 'NGO') : t('شركة', 'Company')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-semibold">{job.posterName || posterKey(job)}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                  <Users className="w-3 h-3" />
                  <span>{applicationCounts[job.id] || 0} {t('متقدم', 'applicants')}</span>
                </div>
              </div>
              <a
                href={`/jobs/${job.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('عرض الوظيفة', 'View Job')}</span>
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
