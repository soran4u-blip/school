'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { localeHref } from '@/lib/locale';
import { getGovernorateById, getTaxonomies } from '@/core/services/masterDataService';
import { getTutorBySlug } from '@/core/services/tutorService';
import { getApprovedTutorReviews, createReview } from '@/core/services/reviewService';
import { Tutor } from '@/core/types/tutor';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Review } from '@/core/types/review';
import { auth } from '@/core/firebase/config';
import { onAuthStateChanged, signInAnonymously, User as FirebaseUser } from 'firebase/auth';
import { isCooldownActive, markSubmitted } from '@/lib/spamGuard';
import {
  MapPin,
  Star,
  ShieldCheck,
  MessageSquare,
  Users,
  User,
  Calendar,
  Check,
  X,
  ListChecks,
  BookOpen,
  GraduationCap,
  Laptop,
  Award,
} from 'lucide-react';

const DELIVERY_MODE_LABEL: Record<string, { ar: string; en: string }> = {
  ONLINE: { ar: 'عن بعد', en: 'Online' },
  IN_PERSON: { ar: 'حضوري', en: 'In Person' },
  HYBRID: { ar: 'مختلط', en: 'Hybrid' },
};

interface SlotStatus {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'INDIVIDUAL' | 'GROUP';
  currentSize: number;
  maxGroupSize: number;
  isFull: boolean;
  pricePerStudent: { iqd: number; usd: number };
}

interface DaySlot {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const DAY_LABELS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sun' },
  { ar: 'الاثنين', en: 'Mon' },
  { ar: 'الثلاثاء', en: 'Tue' },
  { ar: 'الأربعاء', en: 'Wed' },
  { ar: 'الخميس', en: 'Thu' },
  { ar: 'الجمعة', en: 'Fri' },
  { ar: 'السبت', en: 'Sat' },
];

function nextNDays(n: number): { date: string; dayOfWeek: number }[] {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Build the date string from local calendar fields (not toISOString, which
    // converts to UTC and can roll to a different calendar day than d.getDay()
    // reflects whenever the local timezone is ahead of UTC, e.g. late night in Iraq).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push({ date: `${y}-${m}-${day}`, dayOfWeek: d.getDay() });
  }
  return out;
}

export default function TutorProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { language, t } = useLanguage();

  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [governorate, setGovernorate] = useState<Governorate | null>(null);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<DaySlot | null>(null);
  const [bookingMode, setBookingMode] = useState<'INDIVIDUAL' | 'GROUP' | null>(null);
  const [joinBookingId, setJoinBookingId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState({ subjectId: '', recurring: false, weeks: 4 });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; priceIqd?: number } | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewForm, setReviewForm] = useState({ reviewerName: '', rating: 5, comment: '', hp: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const days = nextNDays(14);

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
    async function load() {
      setLoading(true);
      try {
        const tut = await getTutorBySlug(resolvedParams.slug);
        if (tut) {
          setTutor(tut);
          const [gov, taxes, levels, revs] = await Promise.all([
            getGovernorateById(tut.governorateId),
            getTaxonomies('SUBJECT', false),
            getTaxonomies('STUDENT_LEVEL', false),
            getApprovedTutorReviews(tut.id).catch(() => []),
          ]);
          setGovernorate(gov);
          setSubjects(taxes.filter((tx) => tut.subjectIds.includes(tx.id)));
          setStudentLevels(levels.filter((lvl) => tut.studentLevelIds.includes(lvl.id)));
          setReviews(revs);
          await loadSlotStatuses(tut.id);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedParams.slug]);

  // Slot statuses are best-effort/eventually-consistent: poll periodically so a
  // student doesn't act on a stale "open" slot someone else just filled.
  useEffect(() => {
    if (!tutor) return;
    const interval = setInterval(() => loadSlotStatuses(tutor.id), 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor?.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;
    setReviewError('');

    if (reviewForm.hp) return; // honeypot tripped — silently drop

    if (!reviewForm.reviewerName.trim() || !reviewForm.comment.trim()) {
      setReviewError(t('يرجى إدخال الاسم والتعليق', 'Please enter your name and comment'));
      return;
    }
    if (isCooldownActive('tutor-review')) {
      setReviewError(t('يرجى الانتظار قليلاً قبل إرسال تقييم آخر', 'Please wait a moment before submitting another review'));
      return;
    }

    setReviewSubmitting(true);
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      await createReview({
        tutorId: tutor.id,
        reviewerName: reviewForm.reviewerName.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      markSubmitted('tutor-review');
      setReviewSubmitted(true);
      setReviewForm({ reviewerName: '', rating: 5, comment: '', hp: '' });
    } catch {
      setReviewError(t('تعذر إرسال التقييم، حاول مرة أخرى', 'Failed to submit review, please try again'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusFor = (date: string, startTime: string) =>
    slotStatuses.find((s) => s.date === date && s.startTime === startTime);

  const openBooking = (daySlot: DaySlot, mode: 'INDIVIDUAL' | 'GROUP', existingGroupId?: string) => {
    if (!currentUser) {
      router.push(`/login?redirect=${encodeURIComponent(`/tutors/${resolvedParams.slug}`)}`);
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
        setResult({ success: false, message: data.error || t('تعذر إتمام الحجز', 'Booking failed') });
        return;
      }
      const priceIqd = data.booking.pricePerStudent.iqd;
      const price = priceIqd.toLocaleString();
      if (data.bookings?.length > 1) {
        const skippedCount = data.skipped?.length || 0;
        setResult({
          success: true,
          message: t(
            `تم حجز ${data.bookings.length} جلسة أسبوعية بنجاح! السعر لكل جلسة: ${price} د.ع.${skippedCount ? ` (تعذر حجز ${skippedCount} أسبوع بسبب التعارض)` : ''}`,
            `Booked ${data.bookings.length} weekly sessions! Price per session: ${price} IQD${skippedCount ? ` (${skippedCount} week(s) couldn't be booked due to a conflict)` : ''}`
          ),
          priceIqd,
        });
      } else {
        setResult({
          success: true,
          message: t(`تم الحجز بنجاح! السعر لكل طالب: ${price} د.ع.`, `Booked successfully! Price per student: ${price} IQD`),
          priceIqd,
        });
      }
      await loadSlotStatuses(tutor.id);
    } catch {
      setResult({ success: false, message: t('تعذر إتمام الحجز', 'Booking failed') });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-600 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{t('جاري تحميل بيانات الأستاذ...', 'Loading tutor profile...')}</span>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('الأستاذ غير موجود', 'Tutor Not Found')}</h1>
          <Link href={localeHref('/explore', language)} className="px-5 py-2.5 bg-[#0B192C] text-white rounded-xl text-xs font-bold">
            {t('العودة إلى الدليل', 'Back to Directory')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6">
          <Image
            src={tutor.photoUrl}
            alt={tutor.fullName.en}
            width={96}
            height={96}
            className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex-1 space-y-1.5">
            <h1 className="text-xl font-extrabold text-[#0B192C]">{language === 'en' ? tutor.fullName.en : tutor.fullName.ar}</h1>
            <p className="text-sm text-slate-600">{language === 'en' ? tutor.title.en : tutor.title.ar}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{governorate ? (language === 'en' ? governorate.name.en : governorate.name.ar) : tutor.governorateId}</span>
              <span className="flex items-center gap-1 font-bold text-amber-700"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />{tutor.ratingAvg} ({tutor.reviewCount})</span>
              {tutor.isVerified && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold"><ShieldCheck className="w-3.5 h-3.5" />{language === 'en' ? tutor.verificationBadgeLabel.en : tutor.verificationBadgeLabel.ar}</span>
              )}
            </div>
          </div>
          <a
            href={`https://wa.me/${tutor.whatsappNumber}?text=${encodeURIComponent(t(`مرحباً، أود الاستفسار عن الدروس الخصوصية مع ${tutor.fullName.ar}`, `Hi, I'd like to ask about private tutoring with ${tutor.fullName.en}`))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('واتساب', 'WhatsApp')}</span>
          </a>
        </div>

        {tutor.bio?.ar && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6">
            <p className="text-sm text-slate-700 leading-relaxed">{language === 'en' ? tutor.bio.en : tutor.bio.ar}</p>
          </div>
        )}

        {/* Teaching Details: Subjects, Grades, Delivery Mode, Experience */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-4">
          {tutor.yearsOfExperience > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Award className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">{t(`${tutor.yearsOfExperience} سنوات خبرة`, `${tutor.yearsOfExperience} years of experience`)}</span>
            </div>
          )}

          {tutor.deliveryMode?.length > 0 && (
            <div className="flex items-start gap-2">
              <Laptop className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {tutor.deliveryMode.map((mode) => (
                  <span key={mode} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {language === 'en' ? DELIVERY_MODE_LABEL[mode]?.en : DELIVERY_MODE_LABEL[mode]?.ar}
                  </span>
                ))}
              </div>
            </div>
          )}

          {subjects.length > 0 && (
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <span key={s.id} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    {language === 'en' ? s.name.en : s.name.ar}
                  </span>
                ))}
              </div>
            </div>
          )}

          {studentLevels.length > 0 && (
            <div className="flex items-start gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1.5">
                {studentLevels.map((lvl) => (
                  <span key={lvl.id} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {language === 'en' ? lvl.name.en : lvl.name.ar}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t('جلسة فردية', 'Individual Session')}</span>
              <span className="font-extrabold text-sm text-slate-900">{tutor.hourlyRate.iqd.toLocaleString()} {t('د.ع.', 'IQD')}</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase">{t(`جلسة جماعية (حتى ${tutor.groupMaxSize} طلاب)`, `Group Session (up to ${tutor.groupMaxSize})`)}</span>
              <span className="font-extrabold text-sm text-slate-900">{tutor.groupRate.iqd.toLocaleString()} {t('د.ع. إجمالاً — يُقسّم على عدد الطلاب', 'IQD total — split across students')}</span>
            </div>
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900">{t('احجز موعداً', 'Book a Session')}</h2>
          </div>

          {tutor.availability.length === 0 ? (
            <p className="text-xs text-slate-400">{t('لم يحدد الأستاذ أوقات توفر بعد', 'Tutor has not set availability yet')}</p>
          ) : (
            <div className="space-y-3">
              {days.map(({ date, dayOfWeek }) => {
                const daySlots = tutor.availability.filter((s) => s.dayOfWeek === dayOfWeek);
                if (daySlots.length === 0) return null;
                if ((tutor.unavailableDates || []).includes(date)) return null;
                const dateObj = new Date(`${date}T00:00:00`);
                return (
                  <div key={date} className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-slate-100 last:border-0">
                    <span className="w-32 shrink-0 text-xs font-bold text-slate-700">
                      {language === 'en' ? DAY_LABELS[dayOfWeek].en : DAY_LABELS[dayOfWeek].ar} — {dateObj.toLocaleDateString(language === 'en' ? 'en-US' : 'ar-IQ', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot, i) => {
                        const status = statusFor(date, slot.startTime);
                        const daySlot: DaySlot = { date, dayOfWeek, startTime: slot.startTime, endTime: slot.endTime };

                        if (!status) {
                          return (
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-slate-500 px-2 py-1 bg-slate-50 rounded">{slot.startTime}</span>
                              <button
                                onClick={() => openBooking(daySlot, 'INDIVIDUAL')}
                                className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded"
                              >
                                {t('فردي', 'Individual')}
                              </button>
                              <button
                                onClick={() => openBooking(daySlot, 'GROUP')}
                                className="text-[10px] font-bold px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
                              >
                                {t('بدء مجموعة', 'Start Group')}
                              </button>
                            </div>
                          );
                        }

                        if (status.type === 'INDIVIDUAL') {
                          return (
                            <span key={i} className="text-[11px] font-bold px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded">
                              {slot.startTime} — {t('محجوز', 'Booked')}
                            </span>
                          );
                        }

                        if (status.isFull) {
                          return (
                            <span key={i} className="text-[11px] font-bold px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded">
                              {slot.startTime} — {t('المجموعة مكتملة', 'Group Full')}
                            </span>
                          );
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => openBooking(daySlot, 'GROUP', status.bookingId)}
                            className="text-[11px] font-bold px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded flex items-center gap-1"
                          >
                            <Users className="w-3 h-3" />
                            {slot.startTime} — {t(`انضم (${status.currentSize}/${status.maxGroupSize})`, `Join (${status.currentSize}/${status.maxGroupSize})`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900">{t('تقييمات الطلبة وأولياء الأمور', 'Student & Parent Reviews')}</h2>
            <span className="text-xs text-slate-400 font-semibold">{reviews.length} {t('تقييم معتمد', 'approved reviews')}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{rev.reviewerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  {rev.reply && (
                    <div className="ms-4 ps-3 border-s-2 border-emerald-200 mt-2">
                      <span className="text-[10px] font-bold text-emerald-700">
                        {t(`رد ${tutor.fullName.ar}`, `${tutor.fullName.en}'s reply`)}
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.reply.text}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                {t('لا توجد تقييمات معتمدة بعد. كن أول من يشارك رأيه.', 'No approved reviews yet. Be the first to share your experience.')}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 mb-3">{t('شارك تقييمك', 'Write a Review')}</h3>

            {reviewSubmitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                {t('شكراً لك! تم إرسال تقييمك وسيظهر بعد مراجعته من الإدارة.', 'Thank you! Your review was submitted and will appear after moderation.')}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={reviewForm.hp}
                  onChange={(e) => setReviewForm({ ...reviewForm, hp: e.target.value })}
                  className="absolute -left-[9999px] w-px h-px overflow-hidden"
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder={t('اسمك', 'Your name')}
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                  <div className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button type="button" key={i} onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}>
                        <Star className={`w-4 h-4 ${i < reviewForm.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder={t('اكتب تعليقك هنا...', 'Write your comment here...')}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
                {reviewError && <p className="text-[11px] font-bold text-rose-600">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                >
                  {reviewSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال التقييم', 'Submit Review')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedSlot && bookingMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
            <button onClick={closeBooking} className="absolute top-4 end-4 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-[#0B192C] mb-1">
              {bookingMode === 'INDIVIDUAL' ? t('حجز جلسة فردية', 'Book Individual Session') : joinBookingId ? t('الانضمام لمجموعة', 'Join Group') : t('بدء مجموعة جديدة', 'Start New Group')}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {selectedSlot.date} • {selectedSlot.startTime}–{selectedSlot.endTime}
            </p>

            {result ? (
              <div className="space-y-3">
                <div className={`p-4 rounded-xl text-xs font-bold ${result.success ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
                  {result.message}
                </div>
                {result.success && (
                  <a
                    href={`https://wa.me/${tutor.whatsappNumber}?text=${encodeURIComponent(
                      t(
                        `مرحباً، لقد حجزت موعداً معك بتاريخ ${selectedSlot.date} الساعة ${selectedSlot.startTime}. أتطلع للتنسيق معك.`,
                        `Hi, I just booked a session with you on ${selectedSlot.date} at ${selectedSlot.startTime}. Looking forward to coordinating with you.`
                      )
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t('تأكيد الموعد عبر واتساب', 'Confirm via WhatsApp')}
                  </a>
                )}
                {result.success && (
                  <Link
                    href="/account"
                    className="w-full py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {t('عرض كافة حجوزاتي', 'View all my bookings')}
                  </Link>
                )}
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-3">
                {subjects.length > 1 && (
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{language === 'en' ? s.name.en : s.name.ar}</option>
                    ))}
                  </select>
                )}
                {bookingMode === 'INDIVIDUAL' && (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.recurring}
                        onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                        className="rounded text-emerald-600"
                      />
                      <span>{t('تكرار أسبوعي', 'Repeat weekly')}</span>
                    </label>
                    {form.recurring && (
                      <div className="flex items-center gap-2 ps-6">
                        <span className="text-[11px] text-slate-500">{t('لعدد', 'For')}</span>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={form.weeks}
                          onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })}
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg font-mono"
                        />
                        <span className="text-[11px] text-slate-500">{t('أسابيع', 'weeks')}</span>
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? t('جاري الحجز...', 'Booking...') : t('تأكيد الحجز', 'Confirm Booking')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
