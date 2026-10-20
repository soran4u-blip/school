'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useT } from '@/lib/useT';
import { getEmployerById, saveEmployer } from '@/core/services/employerService';
import { getGovernorates } from '@/core/services/masterDataService';
import { getEmployerJobs, getEmployerJobApplications, updateJob, createJob } from '@/core/services/jobService';
import { getEmployerEvents, createEvent, updateEvent } from '@/core/services/eventService';
import { Employer } from '@/core/types/employer';
import { Job } from '@/core/types/job';
import { EduEvent } from '@/core/types/event';
import { Governorate } from '@/core/types/masterData';
import { AlertCircle } from 'lucide-react';
import NotificationsToggle from '@/components/shared/NotificationsToggle';
import ProfileTab from './_components/ProfileTab';
import JobsPanel from './_components/JobsPanel';
import { EMPLOYER_COPY } from './Employer.i18n';
import EventsManager, { DraftEvent } from '@/components/shared/EventsManager';
import ListingRemovedNotice from '@/components/shared/ListingRemovedNotice';
import { isDeleted } from '@/lib/listingLifecycle';

function emptyEvent(employerId: string): Omit<EduEvent, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    employerId,
    posterType: 'NGO',
    title: { ar: '', en: '' },
    description: { ar: '', en: '' },
    eventType: 'OPEN_HOUSE',
    governorateId: '',
    isOnline: false,
    startDate: '',
    status: 'DRAFT',
  };
}

export default function EmployerDashboardPage() {
  const t = useT(EMPLOYER_COPY);
  const [employer, setEmployer] = useState<Employer | null>(null);
  // The id from the auth claim — set even when the employer doc it points at no longer exists.
  const [loadedEmployerId, setLoadedEmployerId] = useState<string | null>(null);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobApplicationCounts, setJobApplicationCounts] = useState<Record<string, number>>({});
  const [editingJob, setEditingJob] = useState<Job | Omit<Job, 'id' | 'createdAt' | 'updatedAt'> | null>(null);
  const [savingJob, setSavingJob] = useState(false);
  const [events, setEvents] = useState<EduEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<DraftEvent | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
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
        setLoadedEmployerId(id);

        const [emp, govs, empJobs, empApplications, empEvents] = await Promise.all([
          getEmployerById(id),
          getGovernorates(false),
          getEmployerJobs(id),
          getEmployerJobApplications(id),
          getEmployerEvents(id),
        ]);
        setEmployer(emp);
        setGovernorates(govs);
        setJobs(empJobs);
        const counts: Record<string, number> = {};
        for (const app of empApplications) counts[app.jobId] = (counts[app.jobId] || 0) + 1;
        setJobApplicationCounts(counts);
        setEvents(empEvents);
      } catch {
        setMessage({ text: t('loadFailed'), type: 'error' });
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
      setMessage({ text: t('jobSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('jobSaveFailed'), type: 'error' });
    } finally {
      setSavingJob(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!employer) return;
    setSavingProfile(true);
    try {
      await saveEmployer(employer);
      setMessage({ text: t('changesSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('changesSaveFailed'), type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleJobStatus = async (jobId: string, status: Job['status']) => {
    await updateJob(jobId, { status });
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
  };

  const handleSaveEvent = async () => {
    if (!editingEvent || !employer) return;
    setSavingEvent(true);
    try {
      if ('id' in editingEvent) {
        await updateEvent(editingEvent.id, editingEvent);
        setEvents((prev) => prev.map((ev) => (ev.id === editingEvent.id ? { ...ev, ...editingEvent } : ev)));
      } else {
        const created = await createEvent({
          ...editingEvent,
          posterName: employer.name,
          posterLogoUrl: employer.logoUrl,
          posterType: 'NGO',
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

  if (loading) {
    return <div className="text-sm text-slate-400 font-bold py-12 text-center">{t('loading')}</div>;
  }

  // A load that failed keeps its own error; a profile that loaded as deleted (or is gone) gets an
  // explanation instead of "could not find your account".
  if (message?.type !== 'error' && (employer ? isDeleted(employer) : loadedEmployerId)) {
    return <ListingRemovedNotice kind="employer" />;
  }

  if (!employer) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>{t('accountNotFound')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">{employer.name}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <NotificationsToggle />

      <ProfileTab
        employer={employer}
        setEmployer={setEmployer}
        governorates={governorates}
        handleSave={handleSaveProfile}
        saving={savingProfile}
      />

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <JobsPanel
        employerId={employer.id}
        jobs={jobs}
        governorates={governorates}
        jobApplicationCounts={jobApplicationCounts}
        editingJob={editingJob}
        setEditingJob={setEditingJob}
        handleSaveJob={handleSaveJob}
        handleJobStatus={handleJobStatus}
        savingJob={savingJob}
      />

      {employer.type === 'NGO' && (
        <EventsManager
          events={events}
          governorates={governorates}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          handleSaveEvent={handleSaveEvent}
          handleEventStatus={handleEventStatus}
          savingEvent={savingEvent}
          onCreateNew={() => setEditingEvent(emptyEvent(employer.id))}
        />
      )}
    </div>
  );
}
