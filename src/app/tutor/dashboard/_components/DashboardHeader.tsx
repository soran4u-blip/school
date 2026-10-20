'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useT } from '@/lib/useT';
import NotificationsToggle from '@/components/shared/NotificationsToggle';
import { Booking } from '@/core/types/booking';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

export type DashboardTab = 'profile' | 'availability' | 'bookings' | 'reviews';

// Top of the tutor dashboard: title, "needs attention" banner, status message and the tab bar.
export default function DashboardHeader({
  tutorName,
  tab,
  setTab,
  pendingCount,
  unreadCount,
  unrepliedReviews,
  nextSession,
  formatDate,
  message,
}: {
  tutorName: string;
  tab: DashboardTab;
  setTab: (tab: DashboardTab) => void;
  pendingCount: number;
  unreadCount: number;
  unrepliedReviews: number;
  nextSession?: Booking;
  formatDate: (date: string) => string;
  message: { text: string; type: 'success' | 'error' } | null;
}) {
  const t = useT(TUTOR_DASHBOARD_COPY);

  return (
    <>
    <div>
      <h1 className="text-2xl font-extrabold text-[#0B192C]">
        {tutorName}
      </h1>
      <p className="text-xs text-slate-500 mt-1">{t('manageSub')}</p>
    </div>

    <NotificationsToggle />

    {(pendingCount > 0 || unreadCount > 0) && (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-amber-900">
            {pendingCount > 0
              ? t(pendingCount === 1 ? 'pendingApprovalOne' : 'pendingApprovalMany', { n: pendingCount })
              : t(unreadCount === 1 ? 'newMessagesOne' : 'newMessagesMany', { n: unreadCount })}
          </p>
          {nextSession && <p className="text-xs text-amber-800 mt-1">{t('nextSession')} {formatDate(nextSession.date)} · {nextSession.startTime}</p>}
        </div>
        <button onClick={() => setTab('bookings')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold">
          {t('openBookings')}
        </button>
      </div>
    )}

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
        {t('tabProfile')}
      </button>
      <button
        onClick={() => setTab('availability')}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'availability' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        {t('tabAvailability')}
      </button>
      <button
        onClick={() => setTab('bookings')}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'bookings' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        {t('tabBookings')} {(pendingCount + unreadCount) > 0 && (
          <span className="ms-1 text-amber-400">({pendingCount + unreadCount})</span>
        )}
      </button>
      <button
        onClick={() => setTab('reviews')}
        className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition-all ${tab === 'reviews' ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
      >
        {t('tabReviews')} {unrepliedReviews > 0 && <span className="ms-1 text-amber-400">({unrepliedReviews})</span>}
      </button>
    </div>
    </>
  );
}
