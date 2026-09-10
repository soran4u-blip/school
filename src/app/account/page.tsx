'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { AlertCircle } from 'lucide-react';
import { ThreadMessage } from '@/core/types/message';
import { Student } from '@/core/types/student';
import { getStudent, saveStudentProfile } from '@/core/services/studentService';
import { getTaxonomies } from '@/core/services/masterDataService';
import { TaxonomyItem } from '@/core/types/masterData';
import { AdmissionApplicationStatus } from '@/core/types/admission';
import NotificationsToggle from '@/components/shared/NotificationsToggle';
import { SavedSearch } from '@/core/types/savedSearch';
import { getSavedSearches, deleteSavedSearch } from '@/core/services/savedSearchService';
import StudentProfileCard from './_components/StudentProfileCard';
import SavedSearchesSection from './_components/SavedSearchesSection';
import BookingsSection from './_components/BookingsSection';
import AdmissionApplicationsSection from './_components/AdmissionApplicationsSection';
import InquiriesSection from './_components/InquiriesSection';

export interface AccountBooking {
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

export interface AccountInquiry {
  id: string;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionSlug: string | null;
  institutionWhatsapp: string | null;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt: string;
}

export interface AccountAdmissionApplication {
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

export default function AccountPage() {
  const { t } = useLanguage();
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
  const [savedSearches, setSavedSearches] = useState<SavedSearch[] | null>(null);
  const [deletingSearchId, setDeletingSearchId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const [bookingsRes, inquiriesRes, admissionApplicationsRes, studentDoc, subs, levels, searches] = await Promise.all([
          fetch('/api/account/bookings'),
          fetch('/api/account/inquiries'),
          fetch('/api/account/admission-applications'),
          getStudent(user.uid),
          getTaxonomies('SUBJECT'),
          getTaxonomies('STUDENT_LEVEL'),
          getSavedSearches(user.uid),
        ]);
        setSavedSearches(searches);
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

  const handleDeleteSearch = async (id: string) => {
    if (!uid) return;
    setDeletingSearchId(id);
    try {
      await deleteSavedSearch(uid, id);
      setSavedSearches((prev) => prev?.filter((s) => s.id !== id) || null);
    } finally {
      setDeletingSearchId(null);
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

      <NotificationsToggle />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {student && (
        <StudentProfileCard
          profileSchool={profileSchool}
          setProfileSchool={setProfileSchool}
          profileLevelId={profileLevelId}
          setProfileLevelId={setProfileLevelId}
          profileSubjectIds={profileSubjectIds}
          setProfileSubjectIds={setProfileSubjectIds}
          subjects={subjects}
          studentLevels={studentLevels}
          savingProfile={savingProfile}
          profileMessage={profileMessage}
          onSave={handleSaveProfile}
        />
      )}

      {savedSearches && savedSearches.length > 0 && (
        <SavedSearchesSection
          savedSearches={savedSearches}
          deletingSearchId={deletingSearchId}
          onDelete={handleDeleteSearch}
        />
      )}

      <div>
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('حجوزاتي', 'My Bookings')}</h2>
      </div>

      {bookings && (
        <BookingsSection
          bookings={bookings}
          expandedThreadId={expandedThreadId}
          toggleThread={toggleThread}
          threadMessages={threadMessages}
          loadingThreadId={loadingThreadId}
          messageDrafts={messageDrafts}
          setMessageDrafts={setMessageDrafts}
          sendingThreadId={sendingThreadId}
          handleSendMessage={handleSendMessage}
          cancellingId={cancellingId}
          handleCancelBooking={handleCancelBooking}
        />
      )}

      <div className="pt-4">
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('طلبات القبول', 'Admission Applications')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('طلبات التقديم على البرامج الأكاديمية وحالتها.', 'Your applications to academic programs and their status.')}</p>
      </div>

      {admissionApplications && (
        <AdmissionApplicationsSection
          admissionApplications={admissionApplications}
          withdrawingId={withdrawingId}
          onWithdraw={handleWithdrawApplication}
        />
      )}

      <div className="pt-4">
        <h2 className="text-lg font-extrabold text-[#0B192C]">{t('استفساراتي', 'My Inquiries')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('استفساراتك المرسلة إلى المؤسسات التعليمية.', 'Inquiries you sent to institutions.')}</p>
      </div>

      {inquiries && (
        <InquiriesSection
          inquiries={inquiries}
          expandedInquiryThreadId={expandedInquiryThreadId}
          toggleInquiryThread={toggleInquiryThread}
          inquiryThreadMessages={inquiryThreadMessages}
          loadingInquiryThreadId={loadingInquiryThreadId}
          inquiryMessageDrafts={inquiryMessageDrafts}
          setInquiryMessageDrafts={setInquiryMessageDrafts}
          sendingInquiryThreadId={sendingInquiryThreadId}
          handleSendInquiryMessage={handleSendInquiryMessage}
        />
      )}
    </div>
  );
}
