'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { getTutorById, saveTutor, getTutorVerificationDocuments, saveTutorVerificationDocuments, deleteTutor } from '@/core/services/tutorService';
import { getTutorBookings, updateBookingStatus } from '@/core/services/bookingService';
import { getGovernorates, getTaxonomies } from '@/core/services/masterDataService';
import { getApprovedTutorReviews, replyToReview } from '@/core/services/reviewService';
import { getThreadMessages, sendTutorMessage } from '@/core/services/messagingService';
import { Tutor, AvailabilitySlot } from '@/core/types/tutor';
import { Booking } from '@/core/types/booking';
import { ThreadMessage } from '@/core/types/message';
import { Review } from '@/core/types/review';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Calendar, Save, AlertCircle, Plus, Trash2, Users, User, Check, X, Phone, UserCog, ListChecks, UserX, KeyRound, PauseCircle, PlayCircle, MessageCircle, Send, Star, ShieldCheck, Rocket } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';
import DocumentUploadField from '@/components/shared/DocumentUploadField';
import { getTutorCompleteness } from '@/lib/utils';

const DAY_LABELS: { ar: string; en: string }[] = [
  { ar: 'الأحد', en: 'Sunday' },
  { ar: 'الاثنين', en: 'Monday' },
  { ar: 'الثلاثاء', en: 'Tuesday' },
  { ar: 'الأربعاء', en: 'Wednesday' },
  { ar: 'الخميس', en: 'Thursday' },
  { ar: 'الجمعة', en: 'Friday' },
  { ar: 'السبت', en: 'Saturday' },
];

export default function TutorDashboardPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'profile' | 'availability' | 'bookings' | 'reviews'>('profile');
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
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
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);

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
    await updateBookingStatus(booking.id, status);
    setBookings(bookings.map(b => (b.id === booking.id ? { ...b, status } : b)));
  };

  const toggleThread = async (bookingId: string) => {
    if (expandedThreadId === bookingId) {
      setExpandedThreadId(null);
      return;
    }
    setExpandedThreadId(bookingId);
    if (!threadMessages[bookingId]) {
      setLoadingThreadId(bookingId);
      try {
        const messages = await getThreadMessages(bookingId);
        setThreadMessages((prev) => ({ ...prev, [bookingId]: messages }));
      } finally {
        setLoadingThreadId(null);
      }
    }
  };

  const handleSendMessage = async (booking: Booking) => {
    const text = messageDrafts[booking.id]?.trim();
    if (!text || !tutor) return;
    setSendingThreadId(booking.id);
    try {
      const sent = await sendTutorMessage(booking, tutor.fullName.en || tutor.fullName.ar, text);
      setThreadMessages((prev) => ({ ...prev, [booking.id]: [...(prev[booking.id] || []), sent] }));
      setMessageDrafts((prev) => ({ ...prev, [booking.id]: '' }));
    } finally {
      setSendingThreadId(null);
    }
  };

  const handleReplyToReview = async (reviewId: string) => {
    const text = replyDrafts[reviewId]?.trim();
    if (!text) return;
    setReplyingId(reviewId);
    try {
      await replyToReview(reviewId, text);
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: { text, createdAt: new Date().toISOString() } } : r)));
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
    } finally {
      setReplyingId(null);
    }
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

  const handleTogglePause = async () => {
    if (!tutor) return;
    const status = tutor.status === 'ACTIVE' ? 'PENDING' : 'ACTIVE';
    if (status === 'PENDING' && !confirm(t('سيتم إخفاء ملفك من الدليل العام ولن يتمكن الطلاب من حجز مواعيد جديدة. هل تريد المتابعة؟', 'Your profile will be hidden from the public directory and students won\'t be able to book new sessions. Continue?'))) {
      return;
    }
    setPausing(true);
    try {
      await saveTutor({ ...tutor, status });
      setTutor({ ...tutor, status });
      setMessage({
        text: status === 'PENDING'
          ? t('تم إيقاف ملفك مؤقتاً — لن يظهر للطلاب حتى تُفعّله مجدداً', 'Your profile is now paused — hidden from students until you resume it')
          : t('تم نشر ملفك وهو الآن ظاهر للطلاب في الدليل العام', 'Your profile is now live and visible to students in the public directory'),
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

          {tutor.status === 'PENDING' && !tutor.isVerified ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-600" />
                <h2 className="font-bold text-sm text-slate-900">{t('نشر ملفك في الدليل العام', 'Publish to the Directory')}</h2>
              </div>
              <p className="text-xs text-slate-500">
                {t(
                  'ملفك غير منشور بعد ولا يظهر للطلاب. أكمل المعلومات التالية ثم انشره.',
                  "Your profile isn't published yet and can't be seen by students. Complete the following, then publish."
                )}
              </p>
              {(() => {
                const completeness = getTutorCompleteness(tutor);
                if (completeness.complete) {
                  return (
                    <button
                      onClick={handleTogglePause}
                      disabled={pausing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{pausing ? t('جاري النشر...', 'Publishing...') : t('نشر الملف الآن', 'Publish Now')}</span>
                    </button>
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
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>{t('أكمل المعلومات أعلاه أولاً', 'Complete the fields above first')}</span>
                    </button>
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
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-slate-900">{t('التسعير', 'Pricing')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('سعر الجلسة الفردية (دينار)', 'Individual Session (IQD)')}</label>
                <input
                  type="number"
                  value={tutor.hourlyRate?.iqd ?? 0}
                  onChange={(e) => setTutor({ ...tutor, hourlyRate: { ...tutor.hourlyRate, iqd: Number(e.target.value) } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('إجمالي سعر الجلسة الجماعية (دينار)', 'Group Session Total (IQD)')}</label>
                <input
                  type="number"
                  value={tutor.groupRate?.iqd ?? 0}
                  onChange={(e) => setTutor({ ...tutor, groupRate: { ...tutor.groupRate, iqd: Number(e.target.value) } })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">{t('يُقسّم هذا المبلغ على عدد الطلاب المنضمين', 'This total is split evenly across however many students join')}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('الحد الأقصى لحجم المجموعة', 'Max Group Size')}</label>
                <input
                  type="number"
                  min={2}
                  value={tutor.groupMaxSize ?? 4}
                  onChange={(e) => setTutor({ ...tutor, groupMaxSize: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Weekly Availability */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-slate-900">{t('أوقات التوفر الأسبوعية', 'Weekly Availability')}</h2>
            </div>

            <div className="space-y-3">
              {DAY_LABELS.map((day, dayOfWeek) => {
                const daySlots = availability
                  .map((slot, idx) => ({ slot, idx }))
                  .filter(({ slot }) => slot.dayOfWeek === dayOfWeek);
                return (
                  <div key={dayOfWeek} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-slate-100 last:border-0">
                    <span className="w-24 shrink-0 text-xs font-bold text-slate-700 pt-2">{language === 'en' ? day.en : day.ar}</span>
                    <div className="flex-1 space-y-2">
                      {daySlots.map(({ slot, idx }) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(idx, { startTime: e.target.value })}
                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          />
                          <span className="text-xs text-slate-400">–</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(idx, { endTime: e.target.value })}
                            className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono"
                          />
                          <button onClick={() => removeSlot(idx)} className="p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSlot(dayOfWeek)}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('إضافة وقت', 'Add time block')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blocked Dates (vacation / one-off unavailability) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <h2 className="font-bold text-sm text-slate-900">{t('أيام محجوبة (إجازة)', 'Blocked Dates (Vacation)')}</h2>
            </div>
            <p className="text-[11px] text-slate-400">
              {t('حدد تواريخ لن تكون فيها متاحاً رغم توافقها مع جدولك الأسبوعي المعتاد.', "Mark specific dates you're unavailable even though they match your usual weekly schedule.")}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
              <button
                onClick={addBlockedDate}
                disabled={!newBlockedDate}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('حجب اليوم', 'Block Date')}</span>
              </button>
            </div>
            {unavailableDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unavailableDates.map((date) => (
                  <span key={date} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-xs font-mono font-bold">
                    {date}
                    <button onClick={() => removeBlockedDate(date)} className="hover:text-rose-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
        </div>
      )}

      {tab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد حجوزات بعد', 'No bookings yet')}</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {booking.type === 'GROUP' ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                    <span className="font-bold text-sm text-slate-900">{booking.date}</span>
                    <span className="text-xs text-slate-500 font-mono">{booking.startTime}–{booking.endTime}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                      booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                      booking.status === 'CANCELLED' || booking.status === 'NO_SHOW' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {booking.type === 'GROUP'
                      ? t(`مجموعة (${booking.participants.length}/${booking.maxGroupSize})`, `Group (${booking.participants.length}/${booking.maxGroupSize})`)
                      : t('جلسة فردية', 'Individual session')}
                    {' • '}
                    <span className="font-bold font-mono">{booking.pricePerStudent.iqd.toLocaleString()} IQD/{t('طالب', 'student')}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {booking.participants.map((p, i) => (
                      <span key={i} className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.name} — {p.phone}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleThread(booking.id)}
                      className={`p-2 rounded-lg ${expandedThreadId === booking.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      title={t('مراسلة', 'Message')}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleBookingStatus(booking, 'CONFIRMED')}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                        title={t('تأكيد', 'Confirm')}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleBookingStatus(booking, 'COMPLETED')}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                          title={t('اكتملت الجلسة', 'Mark Completed')}
                        >
                          <ListChecks className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBookingStatus(booking, 'NO_SHOW')}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                          title={t('لم يحضر الطالب', 'Mark No-show')}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={() => {
                          if (booking.status === 'CONFIRMED' && !confirm(t('هذا الحجز مؤكد بالفعل. هل تريد إلغاءه فعلاً؟', 'This booking is already confirmed. Cancel it anyway?'))) {
                            return;
                          }
                          handleBookingStatus(booking, 'CANCELLED');
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                        title={t('إلغاء', 'Cancel')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>

              {expandedThreadId === booking.id && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {loadingThreadId === booking.id ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                    ) : (threadMessages[booking.id]?.length || 0) === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                    ) : (
                      threadMessages[booking.id].map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderRole === 'tutor' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                            msg.senderRole === 'tutor' ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
                          }`}>
                            <p>{msg.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageDrafts[booking.id] || ''}
                      onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(booking); }}
                      placeholder={t('اكتب رسالة...', 'Write a message...')}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleSendMessage(booking)}
                      disabled={sendingThreadId === booking.id || !messageDrafts[booking.id]?.trim()}
                      className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                      title={t('إرسال', 'Send')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('لا توجد تقييمات معتمدة بعد', 'No approved reviews yet')}</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{review.reviewerName}</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">{review.comment}</p>
                </div>

                {review.reply ? (
                  <div className="ms-4 ps-3 border-s-2 border-emerald-200 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700">{t('ردّك', 'Your reply')}</span>
                    <p className="text-xs text-slate-600">{review.reply.text}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyDrafts[review.id] || ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleReplyToReview(review.id); }}
                      placeholder={t('اكتب رداً علنياً...', 'Write a public reply...')}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleReplyToReview(review.id)}
                      disabled={replyingId === review.id || !replyDrafts[review.id]?.trim()}
                      className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                      title={t('نشر الرد', 'Post reply')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
