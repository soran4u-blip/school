'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { useT } from '@/lib/useT';
import { Booking } from '@/core/types/booking';
import { MessageThreads } from '@/lib/useMessageThreads';
import { formatDate as formatDateUtil } from '@/lib/utils';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';
import BookingCard from './BookingCard';
import type { StudentGroup } from './bookingsGrouping';

// One student's accordion row in the Bookings tab: summary header with batch-confirm / chat
// actions, and (when expanded) the student's session cards.
export default function StudentGroupCard({
  group,
  expanded,
  isBatchLoading,
  onToggle,
  onBatchConfirm,
  handleBookingStatus,
  threads,
  isThreadUnread,
}: {
  group: StudentGroup;
  expanded: boolean;
  isBatchLoading: boolean;
  onToggle: () => void;
  onBatchConfirm: () => void;
  handleBookingStatus: (booking: Booking, status: Booking['status']) => void;
  threads: MessageThreads;
  isThreadUnread: (bookingId: string) => boolean;
}) {
  const { language } = useLanguage();
  const t = useT(TUTOR_DASHBOARD_COPY);
  const router = useRouter();
  const formatDate = (date: string) => formatDateUtil(date, language);
  const hasPending = group.pendingCount > 0;

  return (
        <div
          key={group.key}
          className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
            hasPending ? 'border-amber-300/80 ring-1 ring-amber-200' : 'border-slate-200'
          }`}
        >
          {/* Student Header / Collapsible Trigger */}
          <div
            onClick={onToggle}
            className="p-4 cursor-pointer select-none hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
          >
            <div className="flex items-start md:items-center gap-3">
              {/* Student Avatar / Initial */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  hasPending
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {group.name ? group.name.charAt(0).toUpperCase() : 'S'}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-slate-900">{group.name}</span>
                  {group.phone && (
                    <a
                      href={`tel:${group.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      dir="ltr"
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      {group.phone}
                    </a>
                  )}
                  {group.hasUnread && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      <MessageCircle className="w-2.5 h-2.5" />
                      {t('newMessage')}
                    </span>
                  )}
                </div>

                {/* Summary Badges & Next Session */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {group.bookings.length} {t('sessionsCount')}
                  </span>
                  <span>•</span>
                  {group.nextSession && (
                    <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {t('nextLabel')}{' '}
                      <span className="font-bold text-slate-800">{formatDate(group.nextSession.date)}</span> (
                      <span className="font-mono">{group.nextSession.startTime}</span>)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Badges, Batch Actions, and Chevron */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {hasPending && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  {group.pendingCount} {t('pendingApprovalBadge')}
                </span>
              )}

              {/* Batch Confirm Button */}
              {hasPending && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBatchConfirm();
                  }}
                  disabled={isBatchLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  title={t('confirmAllTitle')}
                >
                  {isBatchLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{t('confirmAll', { n: group.pendingCount })}</span>
                </button>
              )}

              {group.studentId && group.studentId !== 'unknown' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch('/api/conversations', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          recipientId: group.studentId,
                          recipientRole: 'student',
                          recipientName: group.name,
                          recipientPhone: group.phone,
                          context: {
                            type: 'booking',
                            title: `Student: ${group.name}`,
                          },
                        }),
                      });
                      const data = await res.json();
                      if (data.success && data.conversation) {
                        router.push(`/messages?conversationId=${data.conversation.id}`);
                      }
                    } catch {}
                  }}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title={t('chatWithStudent')}
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}

              <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                {expanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded Session Cards Inside Student */}
          {expanded && (
            <div className="p-4 bg-slate-50/40 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t('allSessions')} ({group.bookings.length})
                </span>
                <div className="flex gap-2 text-[11px] text-slate-400">
                  {group.confirmedCount > 0 && (
                    <span className="text-emerald-700">{group.confirmedCount} {t('confirmedCount')}</span>
                  )}
                  {group.completedCount > 0 && (
                    <span className="text-blue-700">{group.completedCount} {t('completedCount')}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {group.bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    handleBookingStatus={handleBookingStatus}
                    threads={threads}
                    isThreadUnread={isThreadUnread}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
  );
}
