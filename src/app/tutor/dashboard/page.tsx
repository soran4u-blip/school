'use client';

import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import OwnerReviewsPanel from '@/components/shared/OwnerReviewsPanel';
import DashboardHeader, { DashboardTab } from './_components/DashboardHeader';
import { useTutorAccountActions } from './_components/useTutorAccountActions';
import ProfileTab from './_components/ProfileTab';
import AvailabilityTab from './_components/AvailabilityTab';
import BookingsTab from './_components/BookingsTab';
import { useMessageThreads } from '@/lib/useMessageThreads';
import { getTutorById, saveTutor, getTutorVerificationRequest, saveTutorVerificationDocuments } from '@/core/services/tutorService';
import { submitTutorVerification } from '@/core/services/tutorVerificationService';
import { subscribeToTutorBookings } from '@/core/services/bookingService';
import { subscribeToTutorThreads } from '@/core/services/messagingService';
import { getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getApprovedTutorReviews } from '@/core/services/reviewService';
import { Tutor, AvailabilitySlot, TutorVerificationRequest } from '@/core/types/tutor';
import { Booking } from '@/core/types/booking';
import { ThreadMessage, Thread } from '@/core/types/message';
import { Review } from '@/core/types/review';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { formatDate as formatDateUtil } from '@/lib/utils';
import ListingRemovedNotice from '@/components/shared/ListingRemovedNotice';
import { isDeleted } from '@/lib/listingLifecycle';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { TUTOR_DASHBOARD_COPY } from './TutorDashboard.i18n';

export default function TutorDashboardPage() {
  const { language } = useLanguage();
  const t = useT(TUTOR_DASHBOARD_COPY);
  const [tab, setTab] = useState<DashboardTab>('profile');
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<TutorVerificationRequest['status']>('NONE');
  const [verificationRejectionReason, setVerificationRejectionReason] = useState<string | undefined>();
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [threadsByBooking, setThreadsByBooking] = useState<Record<string, Thread>>({});
  const hasChosenInitialTab = useRef(false);
  const {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    changingPassword,
    passwordMessage,
    handleChangePassword,
    pausing,
    handleTogglePause,
    deletePassword,
    setDeletePassword,
    deletingAccount,
    deleteError,
    handleDeleteAccount,
  } = useTutorAccountActions({ tutor, setTutor, tutorId, bookings, setMessage });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // No client-side session (never signed in, or the browser lost it while
      // the server-side cookie survived) — stop loading and show the fallback
      // rather than hanging on the spinner forever.
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const tokenResult = await user.getIdTokenResult();
        const id = tokenResult.claims.tutorId as string | undefined;
        if (!id) return;
        setTutorId(id);
        const [tutorDoc, govs, subs, levels, tutorReviews, verifDocs] = await Promise.all([
          getTutorById(id),
          getGovernorates(false),
          getTaxonomies('SUBJECT', false),
          getTaxonomies('STUDENT_LEVEL', false),
          getApprovedTutorReviews(id),
          getTutorVerificationRequest(id),
        ]);
        setTutor(tutorDoc);
        setAvailability(tutorDoc?.availability || []);
        setUnavailableDates(tutorDoc?.unavailableDates || []);
        setGovernorates(govs);
        setSubjects(subs);
        setStudentLevels(levels);
        setReviews(tutorReviews);
        setVerificationDocuments(verifDocs.documents);
        setVerificationStatus(verifDocs.status);
        setVerificationRejectionReason(verifDocs.rejectionReason);
      } catch {
        setMessage({ text: t('loadFailed'), type: 'error' });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live: new booking requests and status changes (made here or elsewhere, e.g. by an admin)
  // appear without a refresh, and the per-booking unread-message dots stay current.
  useEffect(() => {
    if (!tutorId) return;
    const unsubBookings = subscribeToTutorBookings(tutorId, (nextBookings) => {
      setBookings(nextBookings);
      // A tutor who has requests waiting should land on the work that needs attention, not a
      // long profile form. Do this only once so navigating to another tab remains intentional.
      if (!hasChosenInitialTab.current) {
        hasChosenInitialTab.current = true;
        if (nextBookings.some((booking) => booking.status === 'PENDING')) setTab('bookings');
      }
    });
    const unsubThreads = subscribeToTutorThreads(tutorId, (threads) => {
      setThreadsByBooking(Object.fromEntries(threads.map((th) => [th.id, th])));
    });
    return () => {
      unsubBookings();
      unsubThreads();
    };
  }, [tutorId]);

  const isThreadUnread = (bookingId: string) => {
    const th = threadsByBooking[bookingId];
    if (!th || !tutorId || th.lastMessageSenderId === tutorId) return false;
    const readAt = th.readBy?.[tutorId];
    return !readAt || th.lastMessageAt > readAt;
  };

  const addSlot = (dayOfWeek: number) => {
    setAvailability([...availability, { dayOfWeek: dayOfWeek as AvailabilitySlot['dayOfWeek'], startTime: '16:00', endTime: '18:00' }]);
  };
  const removeSlot = (index: number) => setAvailability(availability.filter((_, i) => i !== index));
  const updateSlot = (index: number, patch: Partial<AvailabilitySlot>) =>
    setAvailability(availability.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const availabilityIssue = () => {
    const byDay = new Map<number, AvailabilitySlot[]>();
    for (const slot of availability) {
      if (slot.startTime >= slot.endTime) return t('slotEndAfterStart');
      byDay.set(slot.dayOfWeek, [...(byDay.get(slot.dayOfWeek) || []), slot]);
    }
    for (const slots of byDay.values()) {
      const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (sorted.some((slot, index) => index > 0 && slot.startTime < sorted[index - 1].endTime)) {
        return t('slotsOverlap');
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!tutor) return;
    const issue = availabilityIssue();
    if (issue) {
      setMessage({ text: issue, type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        saveTutor({ ...tutor, availability, unavailableDates }),
        saveTutorVerificationDocuments(tutor.id, verificationDocuments),
      ]);
      setMessage({ text: t('changesSaved'), type: 'success' });
    } catch {
      setMessage({ text: t('saveFailed'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (verificationDocuments.length === 0) return;
    setSubmittingVerification(true);
    try {
      await submitTutorVerification(verificationDocuments);
      setVerificationStatus('PENDING');
      setVerificationRejectionReason(undefined);
      setMessage({ text: t('verificationSubmitted'), type: 'success' });
    } catch {
      setMessage({ text: t('verificationFailed'), type: 'error' });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || unavailableDates.includes(newBlockedDate)) return;
    setUnavailableDates([...unavailableDates, newBlockedDate].sort());
    setNewBlockedDate('');
  };
  const removeBlockedDate = (date: string) => setUnavailableDates(unavailableDates.filter((d) => d !== date));

  // No local state patch needed on success — the live bookings subscription picks up the change.
  const handleBookingStatus = async (booking: Booking, status: Booking['status']) => {
    try {
      const res = await fetch(`/api/tutor/bookings/${booking.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setMessage({ text: t('bookingUpdated'), type: 'success' });
    } catch {
      setMessage({ text: t('bookingUpdateFailed'), type: 'error' });
    }
  };

  // Goes through the API route rather than a direct client write so the participant student gets
  // a push notification — see /api/tutor/bookings/[id]/messages.
  const threads = useMessageThreads(async (bookingId, text) => {
    if (!tutor) return null;
    const res = await fetch(`/api/tutor/bookings/${bookingId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, senderName: tutor.fullName.en || tutor.fullName.ar }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return null;
    return data.message as ThreadMessage;
  }, tutorId || undefined);

  if (loading) {
    return <div className="text-sm text-slate-500">{t('loading')}</div>;
  }

  // Loaded fine but the profile is gone (admin-deleted, or erased outright): say so, rather than
  // the "try refreshing" error below, which only fits a load that actually failed.
  if (tutorId && message?.type !== 'error' && (!tutor || isDeleted(tutor))) {
    return <ListingRemovedNotice kind="tutor" />;
  }

  if (!tutorId || !tutor) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 font-bold">
        {!tutorId
          ? t('notLinked')
          : (message?.text || t('profileLoadFailed'))}
      </div>
    );
  }

  const pendingCount = bookings.filter((booking) => booking.status === 'PENDING').length;
  const unreadCount = bookings.filter((booking) => isThreadUnread(booking.id)).length;
  const nextSession = bookings
    .filter((booking) => booking.status === 'PENDING' || booking.status === 'CONFIRMED')
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))[0];
  const formatDate = (date: string) => formatDateUtil(date, language);

  return (
    <div className="space-y-6">
      <DashboardHeader
        tutorName={pickLocalized(tutor.fullName, language)}
        tab={tab}
        setTab={setTab}
        pendingCount={pendingCount}
        unreadCount={unreadCount}
        unrepliedReviews={reviews.filter((r) => !r.reply).length}
        nextSession={nextSession}
        formatDate={formatDate}
        message={message}
      />

      {tab === 'profile' && (
        <ProfileTab
          tutor={tutor}
          setTutor={setTutor}
          governorates={governorates}
          subjects={subjects}
          studentLevels={studentLevels}
          verificationDocuments={verificationDocuments}
          setVerificationDocuments={setVerificationDocuments}
          verificationStatus={verificationStatus}
          verificationRejectionReason={verificationRejectionReason}
          submittingVerification={submittingVerification}
          onSubmitVerification={handleSubmitVerification}
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

      {tab === 'availability' && (
        <AvailabilityTab
          tutor={tutor}
          setTutor={setTutor}
          availability={availability}
          unavailableDates={unavailableDates}
          addSlot={addSlot}
          removeSlot={removeSlot}
          updateSlot={updateSlot}
          addBlockedDate={addBlockedDate}
          removeBlockedDate={removeBlockedDate}
          newBlockedDate={newBlockedDate}
          setNewBlockedDate={setNewBlockedDate}
          handleSave={handleSave}
          saving={saving}
        />
      )}

      {tab === 'bookings' && (
        <BookingsTab bookings={bookings} handleBookingStatus={handleBookingStatus} threads={threads} isThreadUnread={isThreadUnread} />
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
