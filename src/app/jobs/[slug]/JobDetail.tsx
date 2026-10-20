'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import { JOBS_COPY } from '../Jobs.i18n';
import { localeHref } from '@/lib/locale';
import { Job } from '@/core/types/job';
import { Institution } from '@/core/types/institution';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { auth } from '@/core/firebase/config';
import { signInAnonymously } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { todayLocalDate } from '@/lib/utils';
import { uploadFileOnly } from '@/core/firebase/storage';
import {
  MapPin,
  Building2,
  Clock,
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

const EMPLOYMENT_LABELS: Record<Job['employmentType'], { ar: string; en: string }> = {
  FULL_TIME: { ar: 'دوام كامل', en: 'Full-time' },
  PART_TIME: { ar: 'دوام جزئي', en: 'Part-time' },
  CONTRACT: { ar: 'عقد', en: 'Contract' },
  INTERNSHIP: { ar: 'تدريب', en: 'Internship' },
};

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

// Interactive half of the job detail page (the application form); its content is server-rendered
// in ./page.tsx so the posting itself is in the initial HTML.
export default function JobDetail({
  job,
  institution,
  governorate,
  subjects,
}: {
  job: Job;
  institution: Institution | null;
  governorate: Governorate | null;
  subjects: TaxonomyItem[];
}) {
  const { language } = useLanguage();
  const t = useT(JOBS_COPY);

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', coverLetter: '', hp: '' });
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !job) return;

    const allowed = ['image/', 'application/pdf', 'application/'];
    if (!allowed.some((prefix) => file.type.startsWith(prefix))) {
      setError(t('errFileType'));
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      setError(t('errFileSize'));
      return;
    }

    setError('');
    setUploadingResume(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const ownerId = job.institutionId || job.employerId;
      const path = `job-applications/${ownerId}/${job.id}/${Date.now()}-${file.name}`;
      await uploadFileOnly(file, path);
      setResumeUrl(path);
      setResumeFileName(file.name);
    } catch {
      setError(t('errUpload'));
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setError('');

    if (form.hp) return; // honeypot tripped — silently drop

    if (!form.fullName.trim() || !form.phone.trim()) {
      setError(t('errNamePhone'));
      return;
    }

    if (!resumeUrl) {
      setError(t('errNoResume'));
      return;
    }

    if (isCooldownActive('job-application')) {
      setError(t('errCooldown'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/job-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          ...(form.email.trim() && { email: form.email.trim() }),
          ...(form.coverLetter.trim() && { coverLetter: form.coverLetter.trim() }),
          resumeUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }
      markSubmitted('job-application');
      setSubmitted(true);
      setForm({ fullName: '', phone: '', email: '', coverLetter: '', hp: '' });
      setResumeUrl('');
      setResumeFileName('');
    } catch {
      setError(t('errSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  // Local date, not UTC — the UTC day lags Iraq's by three hours, which kept a passed job
  // deadline looking open past midnight.
  const deadlinePassed = job.applicationDeadline ? job.applicationDeadline < todayLocalDate() : false;
  const canApply = job.status === 'ACTIVE' && !deadlinePassed;
  const jobSubjects = subjects.filter((s) => job.subjectIds?.includes(s.id));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {pickLocalized(job.title, language)}
                  </h1>
                  {institution ? (
                    <Link href={localeHref(`/institutions/${institution.slug}`, language)} className="flex items-center gap-1.5 text-sm text-blue-700 font-bold hover:underline mt-1">
                      <Building2 className="w-4 h-4" />
                      {pickLocalized(institution.name, language)}
                    </Link>
                  ) : job.posterName ? (
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 font-bold mt-1">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {job.posterName}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700">
                        {job.posterType === 'NGO' ? t('ngo') : t('company')}
                      </span>
                    </div>
                  ) : null}
                </div>
                <span className="px-3 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                  {pickLocalized(EMPLOYMENT_LABELS[job.employmentType], language)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.isRemote ? t('remote') : (governorate ? (pickLocalized(governorate.name, language)) : job.governorateId)}
                </span>
                {job.applicationDeadline && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {t('applyBy')}: {job.applicationDeadline}
                  </span>
                )}
                {job.salaryMin && (
                  <span className="font-bold text-slate-700">
                    {job.salaryMin.toLocaleString()}{job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : ''} {job.salaryCurrency}
                  </span>
                )}
                {jobSubjects.length > 0 && (
                  <span className="flex flex-wrap gap-1">
                    {jobSubjects.map((s) => (
                      <span key={s.id} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {pickLocalized(s.name, language)}
                      </span>
                    ))}
                  </span>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1">{t('description')}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {pickLocalized(job.description, language)}
                  </p>
                </div>
                {job.responsibilities && (job.responsibilities.en || job.responsibilities.ar) && (
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">{t('responsibilities')}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {pickLocalized(job.responsibilities, language)}
                    </p>
                  </div>
                )}
                {job.requirements && (job.requirements.en || job.requirements.ar) && (
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 mb-1">{t('requirements')}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {pickLocalized(job.requirements, language)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 sticky top-24">
              <h3 className="font-extrabold text-sm text-slate-900">{t('applyTitle')}</h3>

              {!canApply ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                  {job.status !== 'ACTIVE'
                    ? t('noLongerOpen')
                    : t('deadlinePassed')}
                </div>
              ) : submitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('submittedOk')}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input type="text" value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />

                  <input
                    type="text"
                    required
                    placeholder={t('fullName')}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl font-medium"
                  />
                  <input
                    type="text"
                    required
                    placeholder={t('phone')}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl font-medium font-mono"
                  />
                  <input
                    type="email"
                    placeholder={t('emailOptional')}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl font-medium"
                  />
                  <textarea
                    rows={4}
                    placeholder={t('coverLetterOptional')}
                    value={form.coverLetter}
                    onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl font-medium resize-none"
                  />

                  <div>
                    {resumeFileName ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-xs font-mono text-slate-700">{resumeFileName}</span>
                        <button type="button" onClick={() => { setResumeUrl(''); setResumeFileName(''); }} className="text-slate-400 hover:text-rose-600 shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors w-full">
                        {uploadingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{uploadingResume ? t('uploading') : t('attachResume')}</span>
                        <input type="file" accept="image/*,application/pdf,.doc,.docx" className="hidden" onChange={handleResumeFile} disabled={uploadingResume} />
                      </label>
                    )}
                  </div>

                  {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting || uploadingResume}
                    className="w-full px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {submitting ? t('submitting') : t('submitApplication')}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
