'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { Calendar, Users, User, MessageSquare, MessageCircle, Send, AlertCircle, Save, GraduationCap, X, Building2, FileX } from 'lucide-react';
import { ThreadMessage } from '@/core/types/message';
import { Student } from '@/core/types/student';
import { getStudent, saveStudentProfile } from '@/core/services/studentService';
import { getTaxonomies } from '@/core/services/masterDataService';
import { TaxonomyItem } from '@/core/types/masterData';
import { AdmissionApplicationStatus } from '@/core/types/admission';

interface AccountBooking {
  id: string;
  tutorId: string;
  tutorName: { ar: string; en: string } | null;
  tutorWhatsapp: string | null;
  type: 'INDIVIDUAL' | 'GROUP';
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  pricePerStudent: { iqd: number; usd: number };
  groupSize?: number;
  maxGroupSize?: number;
}

interface AccountInquiry {
  id: string;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionSlug: string | null;
  institutionWhatsapp: string | null;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt: string;
}

interface AccountAdmissionApplication {
  id: string;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionSlug: string | null;
  programId: string;
  programName: { ar: string; en: string };
  status: AdmissionApplicationStatus;
  message: string | null;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}

const ADMISSION_STATUS_LABELS: Record<AdmissionApplicationStatus, { ar: string; en: string }> = {
  SUBMITTED: { ar: 'تم الإرسال', en: 'Submitted' },
  UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under Review' },
  WAITLISTED: { ar: 'قائمة الانتظار', en: 'Waitlisted' },
  ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
  REJECTED: { ar: 'مرفوض', en: 'Rejected' },
  WITHDRAWN: { ar: 'مسحوب', en: 'Withdrawn' },
};

const ADMISSION_STATUS_STYLES: Record<AdmissionApplicationStatus, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700',
  WAITLISTED: 'bg-purple-50 text-purple-700',
  ACCEPTED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-rose-50 text-rose-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
};

export default function AccountPage() {
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState<AccountBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);

  const [uid, setUid] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<TaxonomyItem[]>([]);
  const [studentLevels, setStudentLevels] = useState<TaxonomyItem[]>([]);
  const [profileSchool, setProfileSchool] = useState('');
  const [profileLevelId, setProfileLevelId] = useState('');
  const [profileSubjectIds, setProfileSubjectIds] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [inquiries, setInquiries] = useState<AccountInquiry[] | null>(null);
  const [expandedInquiryThreadId, setExpandedInquiryThreadId] = useState<string | null>(null);
  const [inquiryThreadMessages, setInquiryThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingInquiryThreadId, setLoadingInquiryThreadId] = useState<string | null>(null);
  const [inquiryMessageDrafts, setInquiryMessageDrafts] = useState<Record<string, string>>({});
  const [sendingInquiryThreadId, setSendingInquiryThreadId] = useState<string | null>(null);

  const [admissionApplications, setAdmissionApplications] = useState<AccountAdmissionApplication[] | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const [bookingsRes, inquiriesRes, admissionApplicationsRes, studentDoc, subs, levels] = await Promise.all([
          fetch('/api/account/bookings'),
          fetch('/api/account/inquiries'),
          fetch('/api/account/admission-applications'),
          getStudent(user.uid),
          getTaxonomies('SUBJECT'),
          getTaxonomies('STUDENT_LEVEL'),
        ]);
        const bookingsData = await bookingsRes.json();
        if (!bookingsRes.ok || !bookingsData.success) {
          setError(bookingsData.error || t('تعذر تحميل الحجوزات', 'Failed to load bookings'));
        } else {
          setBookings(bookingsData.bookings);
        }
        const inquiriesData = await inquiriesRes.json();
        if (inquiriesRes.ok && inquiriesData.success) {
          setInquiries(inquiriesData.inquiries);
        }
        const admissionApplicationsData = await admissionApplicationsRes.json();
        if (admissionApplicationsRes.ok && admissionApplicationsData.success) {
          setAdmissionApplications(admissionApplicationsData.applications);
        }
        setStudent(studentDoc);
        setProfileSchool(studentDoc?.school || '');
        setProfileLevelId(studentDoc?.studentLevelId || '');
        setProfileSubjectIds(studentDoc?.subjectIds || []);
        setSubjects(subs);
        setStudentLevels(levels);
      } catch {
        setError(t('تعذر تحميل الحجوزات', 'Failed to load bookings'));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm(t('هل أنت متأكد من سحب هذا الطلب؟', 'Are you sure you want to withdraw this application?'))) return;
    setWithdrawingId(applicationId);
    try {
      const res = await fetch(`/api/account/admission-applications/${applicationId}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر سحب الطلب', 'Failed to withdraw application'));
        return;
      }
      setAdmissionApplications((prev) => prev?.map((a) => (a.id === applicationId ? { ...a, status: 'WITHDRAWN' } : a)) || null);
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!uid) return;
    setSavingProfile(true);
    setProfileMessage('');
    try {
      await saveStudentProfile(uid, {
        school: profileSchool.trim(),
        studentLevelId: profileLevelId,
        subjectIds: profileSubjectIds,
      });
      setProfileMessage(t('تم حفظ الملف الشخصي', 'Profile saved'));
    } catch {
      setProfileMessage(t('تعذر حفظ الملف الشخصي', 'Failed to save profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(t('هل أنت متأكد من إلغاء هذا الحجز؟', 'Are you sure you want to cancel this booking?'))) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/account/bookings/${bookingId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر إلغاء الحجز', 'Failed to cancel booking'));
        return;
      }
      setBookings((prev) => prev?.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b)) || null);
    } finally {
      setCancellingId(null);
    }
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
        const res = await fetch(`/api/account/bookings/${bookingId}/messages`);
        const data = await res.json();
        if (data.success) setThreadMessages((prev) => ({ ...prev, [bookingId]: data.messages }));
      } finally {
        setLoadingThreadId(null);
      }
    }
  };

  const handleSendMessage = async (bookingId: string) => {
    const text = messageDrafts[bookingId]?.trim();
    if (!text) return;
    setSendingThreadId(bookingId);
    try {
      const res = await fetch(`/api/account/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, senderName: 'Student' }),
      });
      const data = await res.json();
      if (data.success) {
        setThreadMessages((prev) => ({ ...prev, [bookingId]: [...(prev[bookingId] || []), data.message] }));
        setMessageDrafts((prev) => ({ ...prev, [bookingId]: '' }));
      }
    } finally {
      setSendingThreadId(null);
    }
  };

  const toggleInquiryThread = async (inquiryId: string) => {
    if (expandedInquiryThreadId === inquiryId) {
      setExpandedInquiryThreadId(null);
      return;
    }
    setExpandedInquiryThreadId(inquiryId);
    if (!inquiryThreadMessages[inquiryId]) {
      setLoadingInquiryThreadId(inquiryId);
      try {
        const res = await fetch(`/api/account/inquiries/${inquiryId}/messages`);
        const data = await res.json();
        if (data.success) setInquiryThreadMessages((prev) => ({ ...prev, [inquiryId]: data.messages }));
      } finally {
        setLoadingInquiryThreadId(null);
      }
    }
  };

  const handleSendInquiryMessage = async (inquiryId: string) => {
    const text = inquiryMessageDrafts[inquiryId]?.trim();
    if (!text) return;
    setSendingInquiryThreadId(inquiryId);
    try {
      const res = await fetch(`/api/account/inquiries/${inquiryId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, senderName: 'Student' }),
      });
      const data = await res.json();
      if (data.success) {
        setInquiryThreadMessages((prev) => ({ ...prev, [inquiryId]: [...(prev[inquiryId] || []), data.message] }));
        setInquiryMessageDrafts((prev) => ({ ...prev, [inquiryId]: '' }));
      }
    } finally {
      setSendingInquiryThreadId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">{t('جاري التحميل...', 'Loading...')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('حجوزاتي واستفساراتي', 'My Bookings & Inquiries')}</h1>
        <p className="text-xs text-slate-500 mt-1">{t('جميع حجوزاتك واستفساراتك ومراسلاتك مع الأساتذة والمؤسسات في مكان واحد.', 'All your bookings, inquiries, and conversations with tutors and institutions in one place.')}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {student && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-extrabold text-[#0B192C]">{t('ملفي الدراسي', 'My Student Profile')}</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('المدرسة', 'School')}</label>
            <input
              type="text"
              value={profileSchool}
              onChange={(e) => setProfileSchool(e.target.value)}
              placeholder={t('اسم مدرستك أو جامعتك', 'Your school or university')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('الصف الدراسي', 'Grade / Level')}</label>
            <select
              value={profileLevelId}
              onChange={(e) => setProfileLevelId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('اختر الصف الدراسي', 'Select your grade / level')}</option>
              {studentLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>{language === 'en' ? lvl.name.en : lvl.name.ar}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">{t('المواد التي تهمك', 'Subjects of Interest')}</label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((sub) => {
                const checked = profileSubjectIds.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${
                      checked ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={(e) => {
                        const ids = new Set(profileSubjectIds);
                        if (e.target.checked) ids.add(sub.id); else ids.delete(sub.id);
                        setProfileSubjectIds(Array.from(ids));
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

          {profileMessage && (
            <p className="text-xs font-semibold text-emerald-700">{profileMessage}</p>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-xs font-bold disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {t('حفظ الملف الشخصي', 'Save Profile')}
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('حجوزاتي', 'My Bookings')}</h2>
      </div>

      {bookings && bookings.length === 0 && (
        <div className="text-center text-sm text-slate-400 py-12">
          {t('لا توجد حجوزات بعد.', 'No bookings yet.')}{' '}
          <Link href="/tutors" className="text-emerald-700 font-bold hover:underline">{t('تصفّح الأساتذة', 'Browse tutors')}</Link>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {b.type === 'GROUP' ? <Users className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
                    <Link href={`/tutors/${b.tutorId}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                      {b.tutorName ? (language === 'en' ? b.tutorName.en : b.tutorName.ar) : b.tutorId}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                      b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                      b.status === 'CANCELLED' || b.status === 'NO_SHOW' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{b.date} • {b.startTime}–{b.endTime}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold">
                    {b.type === 'GROUP' ? t(`مجموعة (${b.groupSize}/${b.maxGroupSize})`, `Group (${b.groupSize}/${b.maxGroupSize})`) : t('فردي', 'Individual')}
                    {' • '}{b.pricePerStudent.iqd.toLocaleString()} {t('د.ع.', 'IQD')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleThread(b.id)}
                    className={`p-2 rounded-lg ${expandedThreadId === b.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={t('مراسلة الأستاذ', 'Message tutor')}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  {b.tutorWhatsapp && (
                    <a
                      href={`https://wa.me/${b.tutorWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title={t('واتساب', 'WhatsApp')}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                  {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingId === b.id}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg disabled:opacity-60"
                      title={t('إلغاء الحجز', 'Cancel booking')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {expandedThreadId === b.id && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {loadingThreadId === b.id ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                    ) : (threadMessages[b.id]?.length || 0) === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                    ) : (
                      threadMessages[b.id].map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                            msg.senderRole === 'student' ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
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
                      value={messageDrafts[b.id] || ''}
                      onChange={(e) => setMessageDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(b.id); }}
                      placeholder={t('اكتب رسالة...', 'Write a message...')}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleSendMessage(b.id)}
                      disabled={sendingThreadId === b.id || !messageDrafts[b.id]?.trim()}
                      className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                      title={t('إرسال', 'Send')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-4">
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('طلبات القبول', 'Admission Applications')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('طلبات التقديم على البرامج الأكاديمية وحالتها.', 'Your applications to academic programs and their status.')}</p>
      </div>

      {admissionApplications && admissionApplications.length === 0 && (
        <div className="text-center text-sm text-slate-400 py-12">
          {t('لا توجد طلبات قبول بعد.', 'No admission applications yet.')}{' '}
          <Link href="/explore" className="text-emerald-700 font-bold hover:underline">{t('تصفّح المؤسسات', 'Browse institutions')}</Link>
        </div>
      )}

      {admissionApplications && admissionApplications.length > 0 && (
        <div className="space-y-3">
          {admissionApplications.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    {app.institutionSlug ? (
                      <Link href={`/institutions/${app.institutionSlug}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                        {app.institutionName ? (language === 'en' ? app.institutionName.en : app.institutionName.ar) : app.institutionId}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-slate-900">
                        {app.institutionName ? (language === 'en' ? app.institutionName.en : app.institutionName.ar) : app.institutionId}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ADMISSION_STATUS_STYLES[app.status]}`}>
                      {language === 'en' ? ADMISSION_STATUS_LABELS[app.status].en : ADMISSION_STATUS_LABELS[app.status].ar}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-bold">
                    {language === 'en' ? app.programName.en : app.programName.ar}
                  </div>
                  {app.decisionNote && (
                    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mt-1">{app.decisionNote}</p>
                  )}
                </div>

                {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW' || app.status === 'WAITLISTED' || app.status === 'ACCEPTED') && (
                  <button
                    onClick={() => handleWithdrawApplication(app.id)}
                    disabled={withdrawingId === app.id}
                    className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold disabled:opacity-60"
                  >
                    <FileX className="w-3.5 h-3.5" />
                    <span>{t('سحب الطلب', 'Withdraw')}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4">
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('استفساراتي', 'My Inquiries')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('استفساراتك المرسلة إلى المؤسسات التعليمية.', 'Inquiries you sent to institutions.')}</p>
      </div>

      {inquiries && inquiries.length === 0 && (
        <div className="text-center text-sm text-slate-400 py-12">
          {t('لا توجد استفسارات بعد.', 'No inquiries yet.')}{' '}
          <Link href="/institutions" className="text-emerald-700 font-bold hover:underline">{t('تصفّح المؤسسات', 'Browse institutions')}</Link>
        </div>
      )}

      {inquiries && inquiries.length > 0 && (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {inq.institutionSlug ? (
                      <Link href={`/institutions/${inq.institutionSlug}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                        {inq.institutionName ? (language === 'en' ? inq.institutionName.en : inq.institutionName.ar) : inq.institutionId}
                      </Link>
                    ) : (
                      <span className="font-bold text-sm text-slate-900">
                        {inq.institutionName ? (language === 'en' ? inq.institutionName.en : inq.institutionName.ar) : inq.institutionId}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inq.status === 'CONTACTED' ? 'bg-emerald-50 text-emerald-700' :
                      inq.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{inq.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleInquiryThread(inq.id)}
                    className={`p-2 rounded-lg ${expandedInquiryThreadId === inq.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title={t('مراسلة المؤسسة', 'Message institution')}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  {inq.institutionWhatsapp && (
                    <a
                      href={`https://wa.me/${inq.institutionWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                      title={t('واتساب', 'WhatsApp')}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {expandedInquiryThreadId === inq.id && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {loadingInquiryThreadId === inq.id ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('جاري التحميل...', 'Loading...')}</p>
                    ) : (inquiryThreadMessages[inq.id]?.length || 0) === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">{t('لا توجد رسائل بعد', 'No messages yet')}</p>
                    ) : (
                      inquiryThreadMessages[inq.id].map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderRole === 'student' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs ${
                            msg.senderRole === 'student' ? 'bg-[#0B192C] text-white' : 'bg-white border border-slate-200 text-slate-700'
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
                      value={inquiryMessageDrafts[inq.id] || ''}
                      onChange={(e) => setInquiryMessageDrafts((prev) => ({ ...prev, [inq.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendInquiryMessage(inq.id); }}
                      placeholder={t('اكتب رسالة...', 'Write a message...')}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      onClick={() => handleSendInquiryMessage(inq.id)}
                      disabled={sendingInquiryThreadId === inq.id || !inquiryMessageDrafts[inq.id]?.trim()}
                      className="p-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-lg disabled:opacity-50"
                      title={t('إرسال', 'Send')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
