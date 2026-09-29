'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import OwnerReviewsPanel from '@/components/shared/OwnerReviewsPanel';
import ProfileTab from './_components/ProfileTab';
import ProgramsTab from './_components/ProgramsTab';
import JobsTab from './_components/JobsTab';
import EventsManager, { DraftEvent } from '@/components/shared/EventsManager';
import MessageThreadPanel from '@/components/shared/MessageThreadPanel';
import { useMessageThreads } from '@/lib/useMessageThreads';
import { getGovernorates, getCategories, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutionById, saveInstitution, deleteInstitution, getInstitutionVerificationDocuments, saveInstitutionVerificationDocuments } from '@/core/services/institutionService';
import { subscribeToInstitutionInquiries, updateInquiryStatus, getApprovedReviews } from '@/core/services/reviewService';
import { getInstitutionJobs, getInstitutionJobApplications, updateJob, createJob } from '@/core/services/jobService';
import { getInstitutionEvents, createEvent, updateEvent } from '@/core/services/eventService';
import { getInstitutionAdmissionApplications } from '@/core/services/admissionService';
import { sendInstitutionMessage, subscribeToInstitutionThreads } from '@/core/services/messagingService';
import { Institution, InstitutionProgram } from '@/core/types/institution';
import { Inquiry, Review } from '@/core/types/review';
import { Thread } from '@/core/types/message';
import { Job } from '@/core/types/job';
import { EduEvent } from '@/core/types/event';
import { Governorate, Category, TaxonomyItem } from '@/core/types/masterData';
import { AlertCircle, Mail, Phone, MessageCircle } from 'lucide-react';
import NotificationsToggle from '@/components/shared/NotificationsToggle';
import { formatDate, todayLocalDate } from '@/lib/utils';
import ListingRemovedNotice from '@/components/shared/ListingRemovedNotice';
import { isDeleted } from '@/lib/listingLifecycle';

function emptyJob(institutionId: string): Omit<Job, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    institutionId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    employmentType: 'FULL_TIME',
    governorateId: '',
    isRemote: false,
    status: 'DRAFT',
  };
}

function emptyEvent(institutionId: string): Omit<EduEvent, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    institutionId,
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    eventType: 'OPEN_HOUSE',
    governorateId: '',
    isOnline: false,
    startDate: '',
    status: 'DRAFT',
  };
}

function emptyProgram(): InstitutionProgram {
  return {
    id: `prog-${Date.now()}`,
    name: { ar: '', en: '' },
    facultyName: { ar: '', en: '' },
    degreeLevelId: 'bachelor',
    // Iraqi institutions price in dinars far more often than dollars; the owner can switch it
    // per-program now that the editor exposes a currency control.
    tuitionAnnual: { amount: 0, currency: 'IQD' },
    durationYears: 4,
    isActive: true,
    isAcceptingApplications: true,
  };
}

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'profile' | 'programs' | 'jobs' | 'events' | 'inquiries' | 'reviews'>('profile');
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [threadsByInquiry, setThreadsByInquiry] = useState<Record<string, Thread>>({});
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxonomies, setTaxonomies] = useState<TaxonomyItem[]>([]);
  const [facilitiesText, setFacilitiesText] = useState('');
  const [programs, setPrograms] = useState<InstitutionProgram[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicationCounts, setJobApplicationCounts] = useState<Record<string, number>>({});
  const [admissionApplicationCounts, setAdmissionApplicationCounts] = useState<Record<string, number>>({});
  const [editingJob, setEditingJob] = useState<Job | Omit<Job, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [savingJob, setSavingJob] = useState(false);
  const [events, setEvents] = useState<EduEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<DraftEvent | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);


  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pausing, setPausing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const hasChosenInitialTab = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult();
        const id = tokenResult.claims.institutionId as string | undefined;
        if (!id) return;
        setInstitutionId(id);
        // Inquiries are not fetched here — they arrive through the live subscription below.
        const [inst, govs, cats, taxes, instReviews, verifDocs, instJobs, instApplications, instAdmissionApplications, instEvents] = await Promise.all([
          getInstitutionById(id),
          getGovernorates(false),
          getCategories(false),
          getTaxonomies(undefined, false),
          getApprovedReviews(id),
          getInstitutionVerificationDocuments(id),
          getInstitutionJobs(id),
          getInstitutionJobApplications(id),
          getInstitutionAdmissionApplications(id),
          getInstitutionEvents(id),
        ]);
        setInstitution(inst);
        setFacilitiesText((inst?.facilities || []).join(', '));
        setPrograms(inst?.programs || []);
        setGovernorates(govs);
        setCategories(cats);
        setTaxonomies(taxes);
        setReviews(instReviews);
        setVerificationDocuments(verifDocs);
        setJobs(instJobs);
        const counts: Record<string, number> = {};
        for (const app of instApplications) counts[app.jobId] = (counts[app.jobId] || 0) + 1;
        setJobApplicationCounts(counts);
        const admissionCounts: Record<string, number> = {};
        for (const app of instAdmissionApplications) {
          if (app.status === 'WITHDRAWN') continue;
          admissionCounts[app.programId] = (admissionCounts[app.programId] || 0) + 1;
        }
        setAdmissionApplicationCounts(admissionCounts);
        setEvents(instEvents);
      } catch {
        setMessage({ text: t('تعذر تحميل بيانات لوحة التحكم', 'Failed to load dashboard data'), type: 'error' });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live: a new inquiry from the public profile lands here without a refresh, and the per-inquiry
  // unread-reply dots stay current. Everything else on this dashboard is still a load-time fetch.
  useEffect(() => {
    if (!institutionId) return;
    const unsubInquiries = subscribeToInstitutionInquiries(institutionId, (nextInquiries) => {
      setInquiries(nextInquiries);
      // Land on the queue that needs attention rather than a long profile form — same reasoning
      // as the tutor dashboard. Done once, so switching tabs afterwards stays intentional.
      if (!hasChosenInitialTab.current) {
        hasChosenInitialTab.current = true;
        if (nextInquiries.some((inq) => inq.status === 'NEW')) setTab('inquiries');
      }
    });
    const unsubThreads = subscribeToInstitutionThreads(institutionId, (threads) => {
      setThreadsByInquiry(Object.fromEntries(threads.map((th) => [th.id, th])));
    });
    return () => {
      unsubInquiries();
      unsubThreads();
    };
  }, [institutionId]);

  const isThreadUnread = (inquiryId: string) => {
    const th = threadsByInquiry[inquiryId];
    if (!th || !institutionId || th.lastMessageSenderId === institutionId) return false;
    const readAt = th.readBy?.[institutionId];
    return !readAt || th.lastMessageAt > readAt;
  };

  const addProgram = () => setPrograms([...programs, emptyProgram()]);
  const removeProgram = (id: string) => setPrograms(programs.filter((p) => p.id !== id));
  const updateProgram = (id: string, patch: Partial<InstitutionProgram>) =>
    setPrograms(programs.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  // Catches the contradictions this form could otherwise save silently, the same way the tutor
  // dashboard validates availability blocks before writing them.
  const profileIssue = () => {
    if (institution && institution.tuition && institution.tuition.min > institution.tuition.max) {
      return t('الحد الأدنى للقسط أكبر من الحد الأعلى.', 'The minimum tuition is higher than the maximum.');
    }
    for (const prog of programs) {
      if (typeof prog.capacity === 'number' && prog.capacity < (prog.acceptedCount || 0)) {
        return t(
          `السعة المحددة لبرنامج "${prog.name.ar || prog.name.en}" أقل من عدد المقبولين بالفعل.`,
          `The capacity set for "${prog.name.en || prog.name.ar}" is below the number of students already accepted.`
        );
      }
      if (prog.applicationDeadline && prog.isAcceptingApplications !== false && prog.applicationDeadline < todayLocalDate()) {
        return t(
          `آخر موعد للتقديم لبرنامج "${prog.name.ar || prog.name.en}" مضى بالفعل، لكنه ما زال مفتوحاً للتقديم.`,
          `The application deadline for "${prog.name.en || prog.name.ar}" has already passed while it is still marked as accepting applications.`
        );
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!institution) return;
    const issue = profileIssue();
    if (issue) {
      setMessage({ text: issue, type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const updated: Institution = {
        ...institution,
        facilities: facilitiesText.split(',').map((f) => f.trim()).filter(Boolean),
        programs,
      };
      await Promise.all([
        saveInstitution(updated),
        saveInstitutionVerificationDocuments(institution.id, verificationDocuments),
      ]);
      setMessage({ text: t('تم حفظ التغييرات بنجاح', 'Changes saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ التغييرات', 'Failed to save changes'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Sending also advances a NEW inquiry to CONTACTED — replying is the contact, so making the
  // owner also change the dropdown by hand was busywork they could forget.
  const threads = useMessageThreads(async (inquiryId, text) => {
    const inquiry = inquiries.find((i) => i.id === inquiryId);
    if (!inquiry || !institution) return null;
    const sent = await sendInstitutionMessage(inquiry, institution.name.en || institution.name.ar, text);
    if (inquiry.status === 'NEW') {
      await updateInquiryStatus(inquiry.id, 'CONTACTED');
      setInquiries((prev) => prev.map((i) => (i.id === inquiry.id ? { ...i, status: 'CONTACTED' } : i)));
    }
    return sent;
    // The reader id was missing, so markThreadRead never ran for institutions and
    // thread.readBy[institutionId] was never written — leaving nothing for an unread indicator
    // to compare against. The tutor dashboard passes its tutorId for the same reason.
  }, institutionId || undefined);

  const handleSaveJob = async () => {
    if (!editingJob || !institution) return;
    setSavingJob(true);
    try {
      if ('id' in editingJob) {
        await updateJob(editingJob.id, editingJob);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? { ...j, ...editingJob } : j)));
      } else {
        const created = await createJob({
          ...editingJob,
          posterName: institution.name.en || institution.name.ar,
          posterLogoUrl: institution.logoUrl,
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

  const handleSaveEvent = async () => {
    if (!editingEvent || !institution) return;
    setSavingEvent(true);
    try {
      if ('id' in editingEvent) {
        await updateEvent(editingEvent.id, editingEvent);
        setEvents((prev) => prev.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...editingEvent } : ev)));
      } else {
        const created = await createEvent({
          ...editingEvent,
          posterName: institution.name.en || institution.name.ar,
          posterLogoUrl: institution.logoUrl,
        });
        setEvents((prev) => [created, ...prev]);
      }
      setEditingEvent(null);
      setMessage({ text: t('تم حفظ الفعالية بنجاح', 'Event saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ الفعالية', 'Failed to save the event'), type: 'error' });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleEventStatus = async (eventId: string, status: EduEvent['status']) => {
    await updateEvent(eventId, { status });
    setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status } : ev)));
  };

  const handleInquiryStatus = async (inquiryId: string, status: Inquiry['status']) => {
    await updateInquiryStatus(inquiryId, status);
    setInquiries((prev) => prev.map((i) => (i.id === inquiryId ? { ...i, status } : i)));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user?.email) return;
    if (newPassword.length < 6) {
      setPasswordMessage({ text: t('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'New password must be at least 6 characters'), type: 'error' });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage({ text: t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'), type: 'success' });
    } catch {
      setPasswordMessage({ text: t('كلمة المرور الحالية غير صحيحة', 'Current password is incorrect'), type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Pause/resume only. A PENDING profile is one an admin hasn't approved yet, and this button
  // used to walk it straight to ACTIVE — self-publishing an unreviewed listing into the public
  // directory. firestore.rules now allows an owner to move only between ACTIVE and SUSPENDED, so
  // this mirrors that: approval is requested here and granted from /admin/institutions.
  const handleTogglePause = async () => {
    if (!institution || !['ACTIVE', 'SUSPENDED'].includes(institution.status)) return;
    const status = institution.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (status === 'SUSPENDED' && !confirm(t('سيتم إخفاء ملف مؤسستك من الدليل العام. هل تريد المتابعة؟', "Your institution's profile will be hidden from the public directory. Continue?"))) {
      return;
    }
    setPausing(true);
    try {
      await saveInstitution({ ...institution, status });
      setInstitution({ ...institution, status });
      setMessage({
        text: status === 'SUSPENDED'
          ? t('تم إيقاف ملف مؤسستك مؤقتاً', 'Your institution profile is now paused')
          : t('تم تفعيل ملف مؤسستك مجدداً', 'Your institution profile is active again'),
        type: 'success',
      });
    } catch {
      setMessage({ text: t('تعذر تحديث حالة الملف', 'Failed to update profile status'), type: 'error' });
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email || !institutionId) return;
    setDeleteError('');

    if (!confirm(t(
      'سيتم حذف ملف مؤسستك وحسابك نهائياً ولن يظهر في الدليل العام بعد الآن. هذا الإجراء لا يمكن التراجع عنه.',
      "This will permanently delete your institution's profile and account — it will no longer appear in the public directory. This cannot be undone."
    ))) {
      return;
    }

    setDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      await deleteInstitution(institutionId);
      await deleteUser(user);
      router.push('/');
    } catch {
      setDeleteError(t('كلمة المرور غير صحيحة', 'Incorrect password'));
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  // Loaded fine but the profile is gone (admin-deleted, or erased outright): say so, rather than
  // the "try refreshing" error below, which only fits a load that actually failed.
  if (institutionId && message?.type !== 'error' && (!institution || isDeleted(institution))) {
    return <ListingRemovedNotice kind="institution" />;
  }

  if (!institutionId || !institution) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 font-bold">
        {!institutionId
          ? t('لم يتم ربط هذا الحساب بملف مؤسسة. تواصل مع الإدارة.', 'This account is not linked to an institution profile. Contact the administrator.')
          : (message?.text || t('تعذر تحميل بيانات الملف. حاول تحديث الصفحة.', 'Failed to load your profile data. Try refreshing the page.'))}
      </div>
    );
  }

  const pendingInquiries = inquiries.filter((i) => i.status === 'NEW').length;
  const pendingReviewReplies = reviews.filter((r) => !r.reply).length;
  const unreadReplies = inquiries.filter((i) => isThreadUnread(i.id)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">
          {language === 'en' ? institution.name.en : institution.name.ar}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t('إدارة ملف مؤسستك، البرامج، الاستفسارات، والتقييمات', 'Manage your institution profile, programs, inquiries, and reviews')}</p>
      </div>

      <NotificationsToggle />

      {(pendingInquiries > 0 || unreadReplies > 0 || pendingReviewReplies > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-amber-900">
              {pendingInquiries > 0
                ? t(`${pendingInquiries} استفسار بانتظار الرد`, `${pendingInquiries} inquir${pendingInquiries === 1 ? 'y' : 'ies'} awaiting a reply`)
                : unreadReplies > 0
                ? t(`${unreadReplies} رد جديد`, `${unreadReplies} new repl${unreadReplies === 1 ? 'y' : 'ies'}`)
                : t(`${pendingReviewReplies} تقييم بلا رد`, `${pendingReviewReplies} review${pendingReviewReplies === 1 ? '' : 's'} without a reply`)}
            </p>
            {(pendingInquiries > 0 && (unreadReplies > 0 || pendingReviewReplies > 0)) && (
              <p className="text-xs text-amber-800 mt-1">
                {[
                  unreadReplies > 0 ? t(`${unreadReplies} رد جديد`, `${unreadReplies} new repl${unreadReplies === 1 ? 'y' : 'ies'}`) : null,
                  pendingReviewReplies > 0 ? t(`${pendingReviewReplies} تقييم بلا رد`, `${pendingReviewReplies} review${pendingReviewReplies === 1 ? '' : 's'} to answer`) : null,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setTab(pendingInquiries > 0 || unreadReplies > 0 ? 'inquiries' : 'reviews')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0"
          >
            {pendingInquiries > 0 || unreadReplies > 0 ? t('فتح الاستفسارات', 'Open inquiries') : t('فتح التقييمات', 'Open reviews')}
          </button>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-lg">
        <button onClick={() => setTab('profile')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'profile' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الملف الشخصي', 'Profile')}
        </button>
        <button onClick={() => setTab('programs')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'programs' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('البرامج', 'Programs')}
        </button>
        <button onClick={() => setTab('jobs')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'jobs' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الوظائف', 'Jobs')}
        </button>
        <button onClick={() => setTab('events')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'events' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الفعاليات', 'Events')}
        </button>
        <button onClick={() => setTab('inquiries')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'inquiries' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('الاستفسارات', 'Inquiries')} {pendingInquiries > 0 && <span className="ms-1 text-amber-400">({pendingInquiries})</span>}
        </button>
        <button onClick={() => setTab('reviews')} className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'reviews' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
          {t('التقييمات', 'Reviews')} {pendingReviewReplies > 0 && <span className="ms-1 text-amber-400">({pendingReviewReplies})</span>}
        </button>
      </div>

      {tab === 'profile' && (
        <ProfileTab
          institution={institution}
          setInstitution={setInstitution}
          categories={categories}
          governorates={governorates}
          taxonomies={taxonomies}
          facilitiesText={facilitiesText}
          setFacilitiesText={setFacilitiesText}
          verificationDocuments={verificationDocuments}
          setVerificationDocuments={setVerificationDocuments}
          handleSave={handleSave}
          saving={saving}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          changingPassword={changingPassword}
          passwordMessage={passwordMessage}
          handleChangePassword={handleChangePassword}
          pausing={pausing}
          handleTogglePause={handleTogglePause}
          deletePassword={deletePassword}
          setDeletePassword={setDeletePassword}
          deletingAccount={deletingAccount}
          deleteError={deleteError}
          handleDeleteAccount={handleDeleteAccount}
        />
      )}

      {tab === 'programs' && institution && (
        <ProgramsTab
          programs={programs}
          admissionApplicationCounts={admissionApplicationCounts}
          addProgram={addProgram}
          removeProgram={removeProgram}
          updateProgram={updateProgram}
          handleSave={handleSave}
          saving={saving}
        />
      )}

      {tab === 'jobs' && institution && (
        <JobsTab
          institution={institution}
          jobs={jobs}
          governorates={governorates}
          jobApplicationCounts={jobApplicationCounts}
          editingJob={editingJob}
          setEditingJob={setEditingJob}
          handleSaveJob={handleSaveJob}
          handleJobStatus={handleJobStatus}
          savingJob={savingJob}
          emptyJob={emptyJob}
        />
      )}

      {tab === 'events' && institution && (
        <EventsManager
          events={events}
          governorates={governorates}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          handleSaveEvent={handleSaveEvent}
          handleEventStatus={handleEventStatus}
          savingEvent={savingEvent}
          onCreateNew={() => setEditingEvent(emptyEvent(institution.id))}
        />
      )}

      {tab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد استفسارات بعد', 'No inquiries yet')}</div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-900">{inq.fullName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inq.status === 'NEW' ? 'bg-blue-50 text-blue-700' : inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {inq.status}
                    </span>
                    {isThreadUnread(inq.id) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {t('رد جديد', 'New reply')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => threads.toggle(inq.id)}
                    className={`relative p-2 rounded-lg ${threads.expandedId === inq.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={t('مراسلة', 'Message')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isThreadUnread(inq.id) && (
                      <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1" dir="ltr"><Phone className="w-3 h-3" />{inq.phone}</span>
                  {inq.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inq.email}</span>}
                  {/* The list showed no date at all, so a three-month-old inquiry looked identical
                      to one that arrived this morning. */}
                  <span className="text-slate-400">{formatDate(inq.createdAt, language)}</span>
                </div>
                {inq.message && <p className="text-xs text-slate-600">{inq.message}</p>}

                <select
                  value={inq.status}
                  onChange={(e) => handleInquiryStatus(inq.id, e.target.value as Inquiry['status'])}
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border ${
                    inq.status === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    inq.status === 'CONTACTED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <option value="NEW">{t('جديد', 'New')}</option>
                  <option value="CONTACTED">{t('تم التواصل', 'Contacted')}</option>
                  <option value="CLOSED">{t('مغلق', 'Closed')}</option>
                </select>

                {threads.expandedId === inq.id && (
                  <MessageThreadPanel threadId={inq.id} threads={threads} ownRole="institution" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <OwnerReviewsPanel
          reviews={reviews}
          onReplied={(reviewId, reply) =>
            setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply } : r)))
          }
        />
      )}
    </div>
  );
}
