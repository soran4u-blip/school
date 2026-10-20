'use client';

import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { pickLocalized } from '@/lib/localized';
import OwnerReviewsPanel from '@/components/shared/OwnerReviewsPanel';
import ProfileTab from './_components/ProfileTab';
import ProgramsTab from './_components/ProgramsTab';
import JobsTab from './_components/JobsTab';
import InquiriesTab from './_components/InquiriesTab';
import DashboardHeader, { DashboardTab } from './_components/DashboardHeader';
import EventsManager, { DraftEvent } from '@/components/shared/EventsManager';
import { useMessageThreads } from '@/lib/useMessageThreads';
import { getGovernorates, getCategories, getTaxonomies } from '@/core/services/masterDataService';
import { getInstitutionById, saveInstitution, getInstitutionVerificationDocuments, saveInstitutionVerificationDocuments } from '@/core/services/institutionService';
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
import { AlertCircle } from 'lucide-react';
import NotificationsToggle from '@/components/shared/NotificationsToggle';
import { todayLocalDate } from '@/lib/utils';
import ListingRemovedNotice from '@/components/shared/ListingRemovedNotice';
import { isDeleted } from '@/lib/listingLifecycle';
import { emptyJob, emptyEvent, emptyProgram } from './dashboardDrafts';
import { useInstitutionAccount } from './useInstitutionAccount';
import { INSTITUTION_COPY } from './Institution.i18n';

export default function InstitutionDashboardPage() {
  const { language } = useLanguage();
  const t = useT(INSTITUTION_COPY);
  const [tab, setTab] = useState<DashboardTab>('profile');
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


  const hasChosenInitialTab = useRef(false);
  const account = useInstitutionAccount({ institution, institutionId, setInstitution, setMessage });

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
        setMessage({ text: t('loadFailed'), type: 'error' });
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
      return t('tuitionMinAboveMax');
    }
    for (const prog of programs) {
      if (typeof prog.capacity === 'number' && prog.capacity < (prog.acceptedCount || 0)) {
        return t('capacityBelowAccepted', { name: pickLocalized(prog.name, language) });
      }
      if (prog.applicationDeadline && prog.isAcceptingApplications !== false && prog.applicationDeadline < todayLocalDate()) {
        return t('deadlinePassed', { name: pickLocalized(prog.name, language) });
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
      setMessage({ text: t('changesSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('changesSaveFailed'), type: 'error' });
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
      setMessage({ text: t('jobSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('jobSaveFailed'), type: 'error' });
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
      setMessage({ text: t('eventSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('eventSaveFailed'), type: 'error' });
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

  if (loading) {
    return <div className="text-sm text-slate-500">{t('loading')}</div>;
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
          ? t('notLinked')
          : (message?.text || t('profileLoadFailed'))}
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
          {pickLocalized(institution.name, language)}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <NotificationsToggle />

      <DashboardHeader
        tab={tab}
        setTab={setTab}
        pendingInquiries={pendingInquiries}
        unreadReplies={unreadReplies}
        pendingReviewReplies={pendingReviewReplies}
      >
        {message && (
          <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{message.text}</span>
            </div>
          </div>
        )}
      </DashboardHeader>

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
          {...account}
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
        <InquiriesTab
          inquiries={inquiries}
          threads={threads}
          isThreadUnread={isThreadUnread}
          handleInquiryStatus={handleInquiryStatus}
        />
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
