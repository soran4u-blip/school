'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { MasterDataService } from '@/core/services/masterDataService';
import { Tutor, AvailabilitySlot } from '@/core/types/tutor';
import { Booking } from '@/core/types/booking';
import { Governorate, TaxonomyItem } from '@/core/types/masterData';
import { Calendar, Save, AlertCircle, Plus, Trash2, Users, User, Check, X, Phone, UserCog } from 'lucide-react';
import ImageUploadField from '@/components/shared/ImageUploadField';

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
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'profile' | 'availability' | 'bookings'>('profile');
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
        const [tutorDoc, tutorBookings, govs, subs, levels] = await Promise.all([
          MasterDataService.getTutorById(id),
          MasterDataService.getTutorBookings(id),
          MasterDataService.getGovernorates(false),
          MasterDataService.getTaxonomies('SUBJECT', false),
          MasterDataService.getTaxonomies('STUDENT_LEVEL', false),
        ]);
        setTutor(tutorDoc);
        setAvailability(tutorDoc?.availability || []);
        setBookings(tutorBookings);
        setGovernorates(govs);
        setSubjects(subs);
        setStudentLevels(levels);
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
      await MasterDataService.saveTutor({ ...tutor, availability });
      setMessage({ text: t('تم حفظ التغييرات بنجاح', 'Changes saved successfully'), type: 'success' });
    } catch {
      setMessage({ text: t('تعذر حفظ التغييرات', 'Failed to save changes'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBookingStatus = async (booking: Booking, status: Booking['status']) => {
    await MasterDataService.updateBookingStatus(booking.id, status);
    setBookings(bookings.map(b => (b.id === booking.id ? { ...b, status } : b)));
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

      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex gap-1 max-w-md">
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
              <div key={booking.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {booking.type === 'GROUP' ? <Users className="w-3.5 h-3.5 text-blue-600" /> : <User className="w-3.5 h-3.5 text-purple-600" />}
                    <span className="font-bold text-sm text-slate-900">{booking.date}</span>
                    <span className="text-xs text-slate-500 font-mono">{booking.startTime}–{booking.endTime}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                      booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
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

                {booking.status === 'PENDING' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleBookingStatus(booking, 'CONFIRMED')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title={t('تأكيد', 'Confirm')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleBookingStatus(booking, 'CANCELLED')}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                      title={t('إلغاء', 'Cancel')}
                    >
                      <X className="w-4 h-4" />
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
