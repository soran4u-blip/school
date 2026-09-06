'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useLanguage } from '@/core/context/LanguageContext';
import { Search, Calendar, Users, User, X, MessageSquare, MessageCircle, Send } from 'lucide-react';
import { ThreadMessage } from '@/core/types/message';

interface LookupBooking {
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

export default function MyBookingsPage() {
  const { language, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<LookupBooking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);
  const [messageDrafts, setMessageDrafts] = useState<Record<string, string>>({});
  const [sendingThreadId, setSendingThreadId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings/lookup?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || t('تعذر البحث عن الحجوزات', 'Failed to look up bookings'));
        return;
      }
      setBookings(data.bookings);
    } catch {
      setError(t('تعذر البحث عن الحجوزات', 'Failed to look up bookings'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm(t('هل أنت متأكد من إلغاء هذا الحجز؟', 'Are you sure you want to cancel this booking?'))) return;
    setCancellingId(bookingId);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, phone: phone.trim() }),
      });
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
        const res = await fetch(`/api/bookings/${bookingId}/messages?phone=${encodeURIComponent(phone.trim())}`);
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
      const res = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), text, senderName: 'Student' }),
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{t('حجوزاتي', 'My Bookings')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('أدخل رقم هاتفك لعرض حجوزاتك مع الأساتذة الخصوصيين.', 'Enter your phone number to view your tutoring session bookings.')}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            placeholder={t('رقم الهاتف', 'Phone number')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl font-mono bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white rounded-xl text-sm font-bold disabled:opacity-60"
          >
            <Search className="w-4 h-4" />
            {t('بحث', 'Search')}
          </button>
        </form>

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">{error}</div>
        )}

        {bookings && (
          bookings.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-12">{t('لا توجد حجوزات بهذا الرقم', 'No bookings found for this number')}</div>
          ) : (
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
                        onClick={() => handleCancel(b.id)}
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
          )
        )}
      </div>

      <Footer />
    </div>
  );
}
