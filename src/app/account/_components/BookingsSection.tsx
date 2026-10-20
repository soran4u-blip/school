'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/core/context/LanguageContext';
import { ThreadMessage } from '@/core/types/message';
import { Calendar, MessageCircle, MessageSquare, Users, User, X } from 'lucide-react';
import MessageThread from './MessageThread';
import type { AccountBooking } from '../accountTypes';
import { pickLocalized } from '@/lib/localized';
import { useT } from '@/lib/useT';
import { ACCOUNT_COPY } from '../Account.i18n';

// The account page's "My Bookings" list — each card shows the booking summary, quick actions
// (message tutor, WhatsApp, cancel), and an expandable message thread. The parent owns all
// booking, thread, and draft state.
export default function BookingsSection({
  bookings,
  expandedThreadId,
  toggleThread,
  threadMessages,
  loadingThreadId,
  messageDrafts,
  setMessageDrafts,
  sendingThreadId,
  handleSendMessage,
  cancellingId,
  handleCancelBooking,
  isThreadUnread,
}: {
  bookings: AccountBooking[];
  expandedThreadId: string | null;
  toggleThread: (bookingId: string) => void;
  threadMessages: Record<string, ThreadMessage[]>;
  loadingThreadId: string | null;
  messageDrafts: Record<string, string>;
  setMessageDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendingThreadId: string | null;
  handleSendMessage: (bookingId: string) => void;
  cancellingId: string | null;
  handleCancelBooking: (bookingId: string) => void;
  isThreadUnread: (bookingId: string) => boolean;
}) {
  const { language } = useLanguage();
  const t = useT(ACCOUNT_COPY);

  if (bookings.length === 0) {
    return (
      <div className="text-center text-sm text-slate-400 py-12">
        {t('noBookings')}{' '}
        <Link href="/tutors" className="text-emerald-700 font-bold hover:underline">{t('browseTutors')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {b.type === 'GROUP' ? <Users className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
                <Link href={`/tutors/${b.tutorId}`} className="font-bold text-sm text-slate-900 hover:text-blue-700">
                  {b.tutorName ? pickLocalized(b.tutorName, language) : b.tutorId}
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
                {b.type === 'GROUP' ? t('groupSession', { size: b.groupSize ?? '', max: b.maxGroupSize ?? '' }) : t('individual')}
                {' • '}{b.pricePerStudent.iqd.toLocaleString()} {t('currencyIqd')}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleThread(b.id)}
                className={`relative p-2 rounded-lg ${expandedThreadId === b.id ? 'bg-[#0B192C] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title={t('messageTutor')}
              >
                <MessageCircle className="w-4 h-4" />
                {isThreadUnread(b.id) && (
                  <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
                )}
              </button>
              {b.tutorWhatsapp && (
                <a
                  href={`https://wa.me/${b.tutorWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg"
                  title={t('whatsapp')}
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
              {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                <button
                  onClick={() => handleCancelBooking(b.id)}
                  disabled={cancellingId === b.id}
                  className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg disabled:opacity-60"
                  title={t('cancelBooking')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {expandedThreadId === b.id && (
            <MessageThread
              messages={threadMessages[b.id]}
              loading={loadingThreadId === b.id}
              draft={messageDrafts[b.id] || ''}
              onDraftChange={(value) => setMessageDrafts((prev) => ({ ...prev, [b.id]: value }))}
              onSend={() => handleSendMessage(b.id)}
              sending={sendingThreadId === b.id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
