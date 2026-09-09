'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Users, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Institution } from '@/core/types/institution';
import { Job } from '@/core/types/job';
import { Governorate } from '@/core/types/masterData';

export type DraftJob = Job | Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;

const EMPLOYMENT_LABELS: Record<Job['employmentType'], { ar: string; en: string }> = {
  FULL_TIME: { ar: 'دوام كامل', en: 'Full-time' },
  PART_TIME: { ar: 'دوام جزئي', en: 'Part-time' },
  CONTRACT: { ar: 'عقد', en: 'Contract' },
  INTERNSHIP: { ar: 'تدريب', en: 'Internship' },
};

// The institution dashboard's Jobs tab: the list of postings plus the inline editor.
export default function JobsTab({
  institution,
  jobs,
  governorates,
  jobApplicationCounts,
  editingJob,
  setEditingJob,
  handleSaveJob,
  handleJobStatus,
  savingJob,
  emptyJob,
}: {
  institution: Institution;
  jobs: Job[];
  governorates: Governorate[];
  jobApplicationCounts: Record<string, number>;
  editingJob: DraftJob | null;
  setEditingJob: (job: DraftJob | null) => void;
  handleSaveJob: () => void;
  handleJobStatus: (jobId: string, status: Job['status']) => void;
  savingJob: boolean;
  emptyJob: (institutionId: string) => Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;
}) {
  const { language, t } = useLanguage();

  return (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>{t('الوظائف الشاغرة', 'Job Postings')}</span>
                </h2>
                {!editingJob && (
                  <button
                    onClick={() => setEditingJob(emptyJob(institution.id))}
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
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('آخر موعد لتقديم الطلبات', 'Application Deadline')}</label>
                      <input
                        type="date"
                        value={editingJob.applicationDeadline || ''}
                        onChange={(e) => setEditingJob({ ...editingJob, applicationDeadline: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                      />
                    </div>
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
                          href={`/institution/dashboard/jobs/${job.id}`}
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
