'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Job, JobApplication } from '@/core/types/job';
import { Institution } from '@/core/types/institution';
import { ThreadMessage } from '@/core/types/message';
import { resolveDownloadURL } from '@/core/firebase/storage';
import {
  ArrowRight, Phone, FileText, MessageCircle, Send, StickyNote, AlertCircle,
} from 'lucide-react';

const STAGES: JobApplication['status'][] = ['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const STAGE_LABELS: Record<JobApplication['status'], { ar: string; en: string }> = {
  SUBMITTED: { ar: 'جديد', en: 'New' },
  REVIEWING: { ar: 'قيد المراجعة', en: 'Reviewing' },
  SHORTLISTED: { ar: 'القائمة المختصرة', en: 'Shortlisted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  HIRED: { ar: 'تم التوظيف', en: 'Hired' },
};

export default function JobApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const { language, t } = useLanguage();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [resumeDownloadUrls, setResumeDownloadUrls] = useState<Record<string, string>>({});

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

        const [inst, jobDoc, allApps] = await Promise.all([
          MasterDataService.getInstitutionById(institutionId),
          MasterDataService.getJobById(jobId),
          MasterDataService.getInstitutionJobApplications(institutionId),
        ]);

        if (!jobDoc || jobDoc.institutionId !== institutionId) {
          setError(t('هذه الوظيفة غير موجودة أو لا تملك صلاحية الوصول إليها', 'This job was not found or you do not have access to it'));
          return;
        }

        const apps = allApps.filter((a) => a.jobId === jobId);
        setInstitution(inst);
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
        setError(t('تعذر تحميل بيانات المتقدمين', 'Failed to load applicant data'));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleMoveStage = async (applicationId: string, status: JobApplication['status']) => {
    await MasterDataService.updateJobApplicationStatus(applicationId, status);
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  const handleSaveNotes = async (applicationId: string) => {
    setSavingNotesId(applicationId);
    try {
      await MasterDataService.updateJobApplicationNotes(applicationId, notesDrafts[applicationId] || '');
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, internalNotes: notesDrafts[applicationId] } : a)));
    } finally {
      setSavingNotesId(null);
    }
  };

  const toggleThread = async (applicationId: string) => {
    if (expandedThreadId === applicationId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(applicationId);
    if (!threadMessages[applicationId]) {
      setLoadingThreadId(applicationId);
      try {
        const messages = await MasterDataService.getThreadMessages(applicationId);
        setThreadMessages((prev) => ({ ...prev, [applicationId]: messages }));
      } finally {
        setLoadingThreadId(null);
      }
    }
  };

  const handleSendMessage = async (application: JobApplication) => {
    const text = messageDrafts[application.id]?.trim();
    if (!text || !institution) return;
    setSendingThreadId(application.id);
    try {
      const sent = await MasterDataService.sendJobApplicationMessage(application, institution.name.en || institution.name.ar, text);
      setThreadMessages((prev) => ({ ...prev, [application.id]: [...(prev[application.id] || []), sent] }));
      setMessageDrafts((prev) => ({ ...prev, [application.id]: '' }));
      if (application.status === 'SUBMITTED') {
        await handleMoveStage(application.id, 'REVIEWING');
      }
    } finally {
      setSendingThreadId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  if (error || !job) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/institution/dashboard" className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2">
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{t('العودة للوحة التحكم', 'Back to dashboard')}</span>
        </Link>
        <h1 className="text-xl font-extrabold text-[#0B192C]">{language === 'en' ? job.title.en : job.title.ar}</h1>
        <p className="text-xs text-slate-500 mt-1">{applications.length} {t('طلب توظيف', 'applications')}</p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage);
            return (
              <div key={stage} className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-800">{language === 'en' ? STAGE_LABELS[stage].en : STAGE_LABELS[stage].ar}</span>
                  <span className="text-[10px] font-bold text-slate-400">{stageApps.length}</span>
                </div>
                <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                  {stageApps.length === 0 ? (
                    <p className="text-[11px] text-slate-300 text-center py-4">—</p>
                  ) : (
                    stageApps.map((app) => (
                      <div key={app.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="font-bold text-xs text-slate-900">{app.fullName}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                          <Phone className="w-3 h-3" />
                          <span>{app.phone}</span>
                        </div>
                        {app.resumeUrl && (
                          <a href={resumeDownloadUrls[app.id] || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-blue-700 hover:underline font-bold">
                            <FileText className="w-3 h-3" />
                            <span>{resumeDownloadUrls[app.id] ? t('عرض السيرة الذاتية', 'View Resume') : t('جاري تحميل السيرة...', 'Loading resume...')}</span>
                          </a>
                        )}
                        {app.coverLetter && (
                          <p className="text-[11px] text-slate-600 line-clamp-3">{app.coverLetter}</p>
                        )}

                        <select
                          value={app.status}
                          onChange={(e) => handleMoveStage(app.id, e.target.value as JobApplication['status'])}
                          className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded-lg font-bold bg-white"
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{language === 'en' ? STAGE_LABELS[s].en : STAGE_LABELS[s].ar}</option>
                          ))}
                        </select>

                        <div className="space-y-1">
                          <label className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <StickyNote className="w-3 h-3" />
                            <span>{t('ملاحظة داخلية', 'Internal note')}</span>
                          </label>
                          <textarea
                            rows={2}
                            value={notesDrafts[app.id] || ''}
                            onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            onBlur={() => handleSaveNotes(app.id)}
                            placeholder={t('ملاحظة خاصة بمؤسستك فقط...', 'Note visible only to your institution...')}
                            className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded-lg resize-none"
                          />
                          {savingNotesId === app.id && <span className="text-[10px] text-slate-400">{t('جاري الحفظ...', 'Saving...')}</span>}
                        </div>

                        <button
                          onClick={() => toggleThread(app.id)}
                          className={`w-full flex items-center justify-center gap-1.5 text-[11px] font-bold py-1.5 rounded-lg ${
                            expandedThreadId === app.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{t('مراسلة المتقدم', 'Message applicant')}</span>
                        </button>

                        {expandedThreadId === app.id && (
                          <div className="bg-white rounded-lg p-2 space-y-2 border border-slate-200">
                            <div className="max-h-40 overflow-y-auto space-y-1.5">
                              {loadingThreadId === app.id ? (
                                <p className="text-[10px] text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                              ) : (threadMessages[app.id]?.length || 0) === 0 ? (
                                <p className="text-[10px] text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                              ) : (
                                threadMessages[app.id].map((msg) => (
                                  <div key={msg.id} className={`flex ${msg.senderRole === 'institution' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-2 py-1.5 rounded-lg text-[11px] ${
                                      msg.senderRole === 'institution' ? 'bg-[#0B192C] text-white' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      <p>{msg.text}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={messageDrafts[app.id] || ''}
                                onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(app); }}
                                placeholder={t('اكتب رسالة...', 'Write a message...')}
                                className="flex-1 px-2 py-1.5 text-[11px] border border-slate-200 rounded-lg"
                              />
                              <button
                                onClick={() => handleSendMessage(app)}
                                disabled={sendingThreadId === app.id || !messageDrafts[app.id]?.trim()}
                                className="p-1.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
