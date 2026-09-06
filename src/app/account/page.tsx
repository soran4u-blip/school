'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/core/firebase/config';
import { useLanguage } from '@/core/context/LanguageContext';
import { Calendar, Users, User, MessageSquare, MessageCircle, Send, AlertCircle } from 'lucide-react';
import { ThreadMessage } from '@/core/types/message';

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

export default function AccountPage() {
  const { language, t } = useLanguage();
  const [bookings, setBookings] = useState<AccountBooking[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);

  const [inquiries, setInquiries] = useState<AccountInquiry[] | null>(null);
  const [expandedInquiryThreadId, setExpandedInquiryThreadId] = useState<string | null>(null);
  const [inquiryThreadMessages, setInquiryThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingInquiryThreadId, setLoadingInquiryThreadId] = useState<string | null>(null);
  const [inquiryMessageDrafts, setInquiryMessageDrafts] = useState<Record<string, string>>({});
  const [sendingInquiryThreadId, setSendingInquiryThreadId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const [bookingsRes, inquiriesRes] = await Promise.all([
          fetch('/api/account/bookings'),
          fetch('/api/account/inquiries'),
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
      } catch {
        setError(t('تعذر تحميل الحجوزات', 'Failed to load bookings'));
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
