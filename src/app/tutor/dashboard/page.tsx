'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import OwnerReviewsPanel from '@/components/shared/OwnerReviewsPanel';
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
import { Save, AlertCircle, Trash2, UserCog, KeyRound, PauseCircle, PlayCircle, ShieldCheck, Rocket } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import { getTutorCompleteness } from '@/lib/utils';

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
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <UserCog className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">{t('البيانات الشخصية', 'Personal Details')}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploadField
                label={t('الصورة الشخصية', 'Photo')}
                value={tutor.photoUrl || ''}
                onChange={(url) => setTutor({ ...tutor, photoUrl: url })}
                pathPrefix={`tutors/${tutor.id}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم الكامل بالعربية', 'Full Name (Arabic)')}</label>
                <input
                  type="text"
                  value={tutor.fullName?.ar || ''}
                  onChange={(e) => setTutor({ ...tutor, fullName: { ...tutor.fullName, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الاسم الكامل بالإنجليزية', 'Full Name (English)')}</label>
                <input
                  type="text"
                  value={tutor.fullName?.en || ''}
                  onChange={(e) => setTutor({ ...tutor, fullName: { ...tutor.fullName, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('اللقب المهني بالعربية', 'Title (Arabic)')}</label>
                <input
                  type="text"
                  placeholder="أستاذ الفيزياء للفرع العلمي"
                  value={tutor.title?.ar || ''}
                  onChange={(e) => setTutor({ ...tutor, title: { ...tutor.title, ar: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('اللقب المهني بالإنجليزية', 'Title (English)')}</label>
                <input
                  type="text"
                  placeholder="Senior Physics Instructor"
                  value={tutor.title?.en || ''}
                  onChange={(e) => setTutor({ ...tutor, title: { ...tutor.title, en: e.target.value } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('نبذة تعريفية', 'Bio')}</label>
              <textarea
                rows={3}
                value={tutor.bio?.ar || ''}
                onChange={(e) => setTutor({ ...tutor, bio: { ar: e.target.value, en: tutor.bio?.en || '' } })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('المحافظة', 'Governorate')}</label>
                <select
                  value={tutor.governorateId || ''}
                  onChange={(e) => setTutor({ ...tutor, governorateId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">{t('اختر المحافظة', 'Select governorate')}</option>
                  {governorates.map((g) => (
                    <option key={g.id} value={g.id}>{language === 'en' ? g.name.en : g.name.ar}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('سنوات الخبرة', 'Years of Experience')}</label>
                <input
                  type="number"
                  min={0}
                  value={tutor.yearsOfExperience ?? 0}
                  onChange={(e) => setTutor({ ...tutor, yearsOfExperience: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم واتساب', 'WhatsApp Number')}</label>
                <input
                  type="text"
                  placeholder="9647801234567"
                  value={tutor.whatsappNumber || ''}
                  onChange={(e) => setTutor({ ...tutor, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الهاتف', 'Phone')}</label>
              <input
                type="text"
                value={tutor.phone || ''}
                onChange={(e) => setTutor({ ...tutor, phone: e.target.value })}
                className="w-full sm:w-1/3 px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>

            {/* Location for "near me" search — no map, just a one-tap browser geolocation capture */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    (pos) => setTutor({ ...tutor, coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
                    () => alert(t('تعذر الوصول إلى الموقع', 'Could not access your location'))
                  );
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                {t('استخدام موقعي الحالي', 'Use My Current Location')}
              </button>
              <span className="text-xs text-slate-500">
                {tutor.coordinates
                  ? t('تم تحديد الموقع — سيظهر في نتائج "القريب مني"', 'Location set — you\'ll appear in "Near Me" search results')
                  : t('لم يتم تحديد الموقع — الظهور حسب المحافظة فقط', 'Not set — only governorate-level matching for now')}
              </span>
            </div>

            {/* Delivery Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t('طريقة التدريس', 'Delivery Mode')}</label>
              <div className="flex gap-2">
                {(['ONLINE', 'IN_PERSON', 'HYBRID'] as const).map((mode) => {
                  const checked = tutor.deliveryMode?.includes(mode) || false;
                  return (
                    <label
                      key={mode}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                        checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const set = new Set(tutor.deliveryMode || []);
                          if (e.target.checked) set.add(mode); else set.delete(mode);
                          setTutor({ ...tutor, deliveryMode: Array.from(set) });
                        }}
                      />
                      {mode.replace('_', ' ')}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t('المواد الدراسية', 'Subjects')}</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((sub) => {
                  const checked = tutor.subjectIds?.includes(sub.id) || false;
                  return (
                    <label
                      key={sub.id}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                        checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const ids = new Set(tutor.subjectIds || []);
                          if (e.target.checked) ids.add(sub.id); else ids.delete(sub.id);
                          setTutor({ ...tutor, subjectIds: Array.from(ids) });
                        }}
                      />
                      {language === 'en' ? sub.name.en : sub.name.ar}
                    </label>
                  );
                })}
                {subjects.length === 0 && (
                  <span className="text-[11px] text-slate-400">{t('لا توجد مواد دراسية بعد', 'No subjects available yet')}</span>
                )}
              </div>
            </div>

            {/* Student Levels / Grades */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{t('الصفوف الدراسية', 'Grades / Student Levels')}</label>
              <div className="flex flex-wrap gap-2">
                {studentLevels.map((lvl) => {
                  const checked = tutor.studentLevelIds?.includes(lvl.id) || false;
                  return (
                    <label
                      key={lvl.id}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                        checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          const ids = new Set(tutor.studentLevelIds || []);
                          if (e.target.checked) ids.add(lvl.id); else ids.delete(lvl.id);
                          setTutor({ ...tutor, studentLevelIds: Array.from(ids) });
                        }}
                      />
                      {language === 'en' ? lvl.name.en : lvl.name.ar}
                    </label>
                  );
                })}
                {studentLevels.length === 0 && (
                  <span className="text-[11px] text-slate-400">{t('لا توجد صفوف دراسية بعد', 'No grades available yet')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">{t('وثائق التوثيق', 'Verification Documents')}</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('ارفع صورة هويتك أو شهاداتك لمساعدة الإدارة على توثيق ملفك — هذه الوثائق خاصة ولا تظهر للعامة.', 'Upload your ID or certificates to help the admin verify your profile — these documents are private and never shown publicly.')}
            </p>
            <DocumentUploadField
              label=""
              value={verificationDocuments}
              onChange={setVerificationDocuments}
              pathPrefix={`tutors/${tutor.id}/verification`}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] text-white rounded-lg text-xs font-bold hover:bg-[#1E3E62] shadow-xs disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ التغييرات', 'Save Changes')}</span>
            </button>
          </div>

          {tutor.status === 'PENDING' ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-sm text-slate-900">{t('نشر ملفك في الدليل العام', 'Publish to the Directory')}</h2>
              </div>
              <p className="text-xs text-slate-500">
                {t(
                  'ملفك غير منشور بعد ولا يظهر للطلاب. أكمل المعلومات التالية ليراجعها فريقنا.',
                  "Your profile isn't published yet and can't be seen by students. Complete the following and our team will review it."
                )}
              </p>
              {(() => {
                const completeness = getTutorCompleteness(tutor);
                if (completeness.complete) {
                  return (
                    <div className="flex items-start gap-2 text-xs text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <Rocket className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="font-medium">
                        {t(
                          'ملفك مكتمل وبانتظار مراجعة الإدارة. سيظهر للطلاب فور الموافقة عليه.',
                          'Your profile is complete and waiting for admin review. It becomes visible to students once approved.'
                        )}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <ul className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                      {completeness.missingFields.map((f) => (
                        <li key={f.en} className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{t(f.ar, f.en)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-400">
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{t('أكمل المعلومات أعلاه أولاً', 'Complete the fields above first')}</span>
                    </p>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                {tutor.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4 text-amber-600" /> : <PlayCircle className="w-4 h-4 text-emerald-600" />}
                <h2 className="font-bold text-sm text-slate-900">{t('ظهور الملف للطلاب', 'Profile Visibility')}</h2>
              </div>
              <p className="text-xs text-slate-500">
                {tutor.status === 'ACTIVE'
                  ? t('ملفك ظاهر حالياً في الدليل العام ويمكن للطلاب حجز مواعيد جديدة.', 'Your profile is currently visible in the public directory and students can book new sessions.')
                  : t('ملفك متوقف مؤقتاً ولن يظهر للطلاب حتى تُفعّله مجدداً.', 'Your profile is paused and hidden from students until you resume it.')}
              </p>
              <button
                onClick={handleTogglePause}
                disabled={pausing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-60 ${
                  tutor.status === 'ACTIVE' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                {tutor.status === 'ACTIVE' ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                <span>
                  {pausing ? t('جاري التحديث...', 'Updating...') : tutor.status === 'ACTIVE' ? t('إيقاف الملف مؤقتاً', 'Pause My Profile') : t('تفعيل الملف مجدداً', 'Resume My Profile')}
                </span>
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-sm text-slate-900">{t('تغيير كلمة المرور', 'Change Password')}</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('كلمة المرور الحالية', 'Current Password')}</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('كلمة المرور الجديدة', 'New Password')}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
              {passwordMessage && (
                <p className={`text-xs font-bold px-3 py-2 rounded-lg ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {passwordMessage.text}
                </p>
              )}
              <button
                type="submit"
                disabled={changingPassword}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-60"
              >
                {changingPassword ? t('جاري التغيير...', 'Changing...') : t('تحديث كلمة المرور', 'Update Password')}
              </button>
            </form>
          </div>

          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2 className="font-bold text-sm text-rose-900">{t('منطقة الخطر', 'Danger Zone')}</h2>
            </div>
            <p className="text-xs text-rose-700">
              {t('حذف حسابك نهائياً — سيُخفى ملفك عن الطلاب وتُلغى حجوزاتك القادمة. لا يمكن التراجع عن هذا الإجراء.', 'Permanently delete your account — your profile disappears from the directory and any upcoming bookings are cancelled. This cannot be undone.')}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 max-w-sm">
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t('كلمة المرور للتأكيد', 'Password to confirm')}
                className="flex-1 w-full px-3 py-2 text-xs border border-rose-200 rounded-lg"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || !deletePassword}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingAccount ? t('جاري الحذف...', 'Deleting...') : t('حذف حسابي نهائياً', 'Delete My Account')}</span>
              </button>
            </div>
            {deleteError && (
              <p className="text-xs font-bold px-3 py-2 rounded-lg bg-rose-100 text-rose-800">{deleteError}</p>
            )}
          </div>
        </div>
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
