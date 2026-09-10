'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import OwnerReviewsPanel from '@/components/shared/OwnerReviewsPanel';
import ProfileTab from './_components/ProfileTab';
import AvailabilityTab from './_components/AvailabilityTab';
import BookingsTab from './_components/BookingsTab';
import { useMessageThreads } from '@/lib/useMessageThreads';
import { getTutorById, saveTutor, getTutorVerificationDocuments, saveTutorVerificationDocuments, deleteTutor } from '@/core/services/tutorService';
import { getTutorBookings, updateBookingStatus } from '@/core/services/bookingService';
import { getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getApprovedTutorReviews } from '@/core/services/reviewService';
import { Tutor, AvailabilitySlot } from '@/core/types/tutor';
import { Booking } from '@/core/types/booking';
import { ThreadMessage } from '@/core/types/message';
import { Review } from '@/core/types/review';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { AlertCircle } from 'lucide-react';

export default function TutorDashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'profile' | 'availability' | 'bookings' | 'reviews'>('profile');
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [pausing, setPausing] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [verificationDocuments, setVerificationDocuments] = useState<string[]>([]);

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
        const [tutorDoc, tutorBookings, govs, subs, levels, tutorReviews, verifDocs] = await Promise.all([
          getTutorById(id),
          getTutorBookings(id),
          getGovernorates(false),
          getTaxonomies('SUBJECT', false),
          getTaxonomies('STUDENT_LEVEL', false),
          getApprovedTutorReviews(id),
          getTutorVerificationDocuments(id),
        ]);
        setTutor(tutorDoc);
        setAvailability(tutorDoc?.availability || []);
        setUnavailableDates(tutorDoc?.unavailableDates || []);
        setBookings(tutorBookings);
        setGovernorates(govs);
        setSubjects(subs);
        setStudentLevels(levels);
        setReviews(tutorReviews);
        setVerificationDocuments(verifDocs);
      } catch {
        setMessage({ text: t('تعذر تحميل بيانات لوحة التحكم', 'Failed to load dashboard data'), type: 'error' });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSlot = (dayOfWeek: number) => {
    setAvailability([...availability, { dayOfWeek: dayOfWeek as AvailabilitySlot['dayOfWeek'], startTime: '16:00', endTime: '18:00' }]);
  };
  const removeSlot = (index: number) => setAvailability(availability.filter((_, i) => i !== index));
  const updateSlot = (index: number, patch: Partial<AvailabilitySlot>) =>
    setAvailability(availability.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const handleSave = async () => {
    if (!tutor) return;
    setSaving(true);
    try {
      await Promise.all([
        saveTutor({ ...tutor, availability, unavailableDates }),
        saveTutorVerificationDocuments(tutor.id, verificationDocuments),
      ]);
      setMessage({ text: t('تم حفظ التغييرات بنجاح', 'Changes saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ التغييرات', 'Failed to save changes'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || unavailableDates.includes(newBlockedDate)) return;
    setUnavailableDates([...unavailableDates, newBlockedDate].sort());
    setNewBlockedDate('');
  };
  const removeBlockedDate = (date: string) => setUnavailableDates(unavailableDates.filter((d) => d !== date));

  const handleBookingStatus = async (booking: Booking, status: Booking['status']) => {
    const res = await fetch(`/api/tutor/bookings/${booking.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return;
    setBookings(bookings.map(b => (b.id === booking.id ? { ...b, status } : b)));
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
  });

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

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user?.email || !tutorId) return;
    setDeleteError('');

    if (!confirm(t(
      'سيتم حذف ملفك الشخصي وحسابك نهائياً ولن يظهر للطلاب بعد الآن. سيتم إلغاء حجوزاتك القادمة. هذا الإجراء لا يمكن التراجع عنه.',
      'This will permanently delete your profile and account — you will no longer appear to students, and your upcoming bookings will be cancelled. This cannot be undone.'
    ))) {
      return;
    }

    setDeletingAccount(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);

      // Cancel any bookings still in play before the tutor doc disappears from under them.
      await Promise.all(
        bookings
          .filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED')
          .map((b) => updateBookingStatus(b.id, 'CANCELLED'))
      );

      await deleteTutor(tutorId);
      await deleteUser(user);
      router.push('/');
    } catch {
      setDeleteError(t('كلمة المرور غير صحيحة', 'Incorrect password'));
    } finally {
      setDeletingAccount(false);
    }
  };

  // Pause/resume only, between ACTIVE and SUSPENDED. This used to toggle ACTIVE<->PENDING, which
  // conflated "paused by me" with "not yet approved by an admin" and let an unreviewed tutor
  // publish themselves into the directory. firestore.rules now permits an owner only the
  // ACTIVE<->SUSPENDED transition; approval happens in /admin/tutors.
  const handleTogglePause = async () => {
    if (!tutor || tutor.status === 'PENDING') return;
    const status = tutor.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (status === 'SUSPENDED' && !confirm(t('سيتم إخفاء ملفك من الدليل العام ولن يتمكن الطلاب من حجز مواعيد جديدة. هل تريد المتابعة؟', 'Your profile will be hidden from the public directory and students won\'t be able to book new sessions. Continue?'))) {
      return;
    }
    setPausing(true);
    try {
      await saveTutor({ ...tutor, status });
      setTutor({ ...tutor, status });
      setMessage({
        text: status === 'SUSPENDED'
          ? t('تم إيقاف ملفك مؤقتاً — لن يظهر للطلاب حتى تُفعّله مجدداً', 'Your profile is now paused — hidden from students until you resume it')
          : t('تم تفعيل ملفك وهو الآن ظاهر للطلاب في الدليل العام', 'Your profile is active again and visible to students in the public directory'),
        type: 'success',
      });
    } catch {
      setMessage({ text: t('تعذر تحديث حالة الملف', 'Failed to update profile status'), type: 'error' });
    } finally {
      setPausing(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  if (!tutorId || !tutor) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-sm text-rose-800 font-bold">
        {!tutorId
          ? t('لم يتم ربط هذا الحساب بملف أستاذ. تواصل مع الإدارة.', 'This account is not linked to a tutor profile. Contact the administrator.')
          : (message?.text || t('تعذر تحميل بيانات الملف الشخصي. حاول تحديث الصفحة.', 'Failed to load your profile data. Try refreshing the page.'))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">
          {language === 'en' ? tutor.fullName.en : tutor.fullName.ar}
        </h1>
        <p className="text-xs text-slate-500 mt-1">{t('إدارة أوقات التوفر، الأسعار، والحجوزات', 'Manage your availability, pricing, and bookings')}</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-lg">
        <button
          onClick={() => setTab('profile')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'profile' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('الملف الشخصي', 'Profile')}
        </button>
        <button
          onClick={() => setTab('availability')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'availability' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('التوفر والأسعار', 'Availability & Pricing')}
        </button>
        <button
          onClick={() => setTab('bookings')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'bookings' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('الحجوزات', 'My Bookings')} {bookings.filter(b => b.status === 'PENDING').length > 0 && <span className="ms-1 text-amber-400">({bookings.filter(b => b.status === 'PENDING').length})</span>}
        </button>
        <button
          onClick={() => setTab('reviews')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'reviews' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {t('التقييمات', 'Reviews')} {reviews.filter(r => !r.reply).length > 0 && <span className="ms-1 text-amber-400">({reviews.filter(r => !r.reply).length})</span>}
        </button>
      </div>

      {tab === 'profile' && (
        <ProfileTab
          tutor={tutor}
          setTutor={setTutor}
          governorates={governorates}
          subjects={subjects}
          studentLevels={studentLevels}
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
        <BookingsTab bookings={bookings} handleBookingStatus={handleBookingStatus} threads={threads} />
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
