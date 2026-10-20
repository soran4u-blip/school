'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { useLoadOnMount } from '@/lib/useLoadOnMount';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import TutorHeader from './_components/TutorHeader';
import AvailabilityCalendar from './_components/AvailabilityCalendar';
import ReviewsSection from './_components/ReviewsSection';
import BookingModal from './_components/BookingModal';
import { nextNDays, type DaySlot, type SlotStatus } from './slots';
import { Review } from '@/core/types/review';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import { formatDate as formatDateUtil } from '@/lib/utils';
import { localeHref } from '@/lib/locale';
import { useT } from '@/lib/useT';
import { TUTOR_PROFILE_COPY } from './TutorProfile.i18n';



// Interactive half of the tutor profile; its data is fetched on the server in ./page.tsx and
// passed in, so the profile is present in the initial HTML rather than after a client-side round
// of Firestore reads.
export default function TutorProfile({
  tutor,
  governorate,
  subjects,
  studentLevels,
  initialReviews,
}: {
  tutor: Tutor;
  governorate: Governorate | null;
  subjects: TaxonomyItem[];
  studentLevels: TaxonomyItem[];
  initialReviews: Review[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const t = useT(TUTOR_PROFILE_COPY);
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);
  const [bookingMode, setBookingMode] = useState<'INDIVIDUAL' | 'GROUP' | null>(null);
  const [joinBookingId, setJoinBookingId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ subjectId: '', recurring: false, weeks: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; priceIqd?: number } | null>(null);

  // Server-provided. A newly submitted review starts PENDING, so it never joins this list
  // client-side — it appears after moderation, on the next server render.
  const reviews = initialReviews;
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 5, comment: '', hp: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const days = nextNDays(14);
  const formatDate = (date: string) => formatDateUtil(date, language);

  const loadSlotStatuses = async (tutorId: string) => {
    const from = days[0].date;
    const to = days[days.length - 1].date;
    try {
      const res = await fetch(`/api/tutors/${tutorId}/slots?from=${from}&to=${to}`);
      const data = await res.json();
      if (data.success) setSlotStatuses(data.slots);
    } catch {
      // Slot status is best-effort; leave slots rendering as open on failure.
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.isAnonymous || selectedSlot || bookingMode) return;

    const date = searchParams.get('bookDate');
    const startTime = searchParams.get('bookStart');
    const endTime = searchParams.get('bookEnd');
    const mode = searchParams.get('bookMode');
    if (!date || !startTime || !endTime || (mode !== 'INDIVIDUAL' && mode !== 'GROUP')) return;

    const day = nextNDays(14).find((item) => item.date === date);
    if (!day) return;

    const restore = window.setTimeout(() => {
      setSelectedSlot({ ...day, startTime, endTime });
      setBookingMode(mode);
      setJoinBookingId(searchParams.get('bookGroup') || undefined);
      setForm({ subjectId: subjects[0]?.id || '', recurring: false, weeks: 4 });
      setResult(null);
      router.replace(localeHref(`/tutors/${tutor.slug || tutor.id}`, language), { scroll: false });
    }, 0);
    return () => window.clearTimeout(restore);
  }, [bookingMode, currentUser, language, router, searchParams, selectedSlot, subjects, tutor.id, tutor.slug]);

  // Slot availability is the one piece that must stay live rather than server-rendered — it
  // changes as other students book.
  useLoadOnMount(() => loadSlotStatuses(tutor.id));

  // Slot statuses are best-effort/eventually-consistent: poll periodically so a
  // student doesn't act on a stale "open" slot someone else just filled.
  useEffect(() => {
    const interval = setInterval(() => loadSlotStatuses(tutor.id), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;
    setReviewError('');

    if (reviewForm.hp) return; // honeypot tripped — silently drop

    if (!reviewForm.reviewerName.trim() || !reviewForm.comment.trim()) {
      setReviewError(t('reviewNameComment'));
      return;
    }
    if (isCooldownActive('tutor-review')) {
      setReviewError(t('reviewWait'));
      return;
    }

    setReviewSubmitting(true);
    try {
      // Always goes through the server route now (firestore.rules denies client-side review
      // creates entirely — see isValidReview()). A real, logged-in student is checked for an
      // actual completed booking and gets the "Verified" badge; a guest is rate-limited by IP
      // instead of uid and never verified.
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          ...(!(currentUser && !currentUser.isAnonymous) && { reviewerName: reviewForm.reviewerName.trim() }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }
      markSubmitted('tutor-review');
      setReviewSubmitted(true);
      setReviewForm({ reviewerName: '', rating: 5, comment: '', hp: '' });
    } catch {
      setReviewError(t('reviewFailed'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusFor = (date: string, startTime: string) =>
    slotStatuses.find((s) => s.date === date && s.startTime === startTime);

  const openBooking = (daySlot: DaySlot, mode: 'INDIVIDUAL' | 'GROUP', existingGroupId?: string) => {
    if (!currentUser || currentUser.isAnonymous) {
      const returnParams = new URLSearchParams({
        bookDate: daySlot.date,
        bookStart: daySlot.startTime,
        bookEnd: daySlot.endTime,
        bookMode: mode,
      });
      if (existingGroupId) returnParams.set('bookGroup', existingGroupId);
      const returnPath = `${localeHref(`/tutors/${tutor.slug || tutor.id}`, language)}?${returnParams.toString()}`;
      router.push(`${localeHref('/login', language)}?redirect=${encodeURIComponent(returnPath)}&reason=booking`);
      return;
    }
    setSelectedSlot(daySlot);
    setBookingMode(mode);
    setJoinBookingId(existingGroupId);
    setForm({ subjectId: subjects[0]?.id || '', recurring: false, weeks: 4 });
    setResult(null);
  };

  const closeBooking = () => {
    setSelectedSlot(null);
    setBookingMode(null);
    setJoinBookingId(undefined);
    setResult(null);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor || !selectedSlot || !bookingMode) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          type: bookingMode,
          joinBookingId,
          ...(form.subjectId && { subjectId: form.subjectId }),
          ...(bookingMode === 'INDIVIDUAL' && form.recurring && { recurring: true, weeks: form.weeks }),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setResult({ success: false, message: data.error || t('bookingFailed') });
        return;
      }
      const priceIqd = data.booking.pricePerStudent.iqd;
      const price = priceIqd.toLocaleString();
      if (data.bookings?.length > 1) {
        const skippedCount = data.skipped?.length || 0;
        setResult({
          success: true,
          message: t('bookedWeekly', { n: data.bookings.length, price, skipped: skippedCount ? t('bookedSkipped', { n: skippedCount }) : '' }),
          priceIqd,
        });
      } else {
        setResult({
          success: true,
          message: t('bookedOne', { price }),
          priceIqd,
        });
      }
      await loadSlotStatuses(tutor.id);
    } catch {
      setResult({ success: false, message: t('bookingFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <TutorHeader tutor={tutor} governorate={governorate} subjects={subjects} studentLevels={studentLevels} />

        {/* Availability Calendar */}
        <AvailabilityCalendar tutor={tutor} days={days} statusFor={statusFor} openBooking={openBooking} />

        {/* Reviews */}
        <ReviewsSection
          tutor={tutor}
          reviews={reviews}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewSubmitting={reviewSubmitting}
          reviewSubmitted={reviewSubmitted}
          reviewError={reviewError}
          onSubmitReview={handleSubmitReview}
        />
      </div>

      {/* Booking Modal */}
      {selectedSlot && bookingMode && (
        <BookingModal
          tutor={tutor}
          subjects={subjects}
          selectedSlot={selectedSlot}
          bookingMode={bookingMode}
          joinBookingId={joinBookingId}
          form={form}
          setForm={setForm}
          submitting={submitting}
          result={result}
          formatDate={formatDate}
          onSubmit={submitBooking}
          onClose={closeBooking}
        />
      )}

      <Footer />
    </div>
  );
}
