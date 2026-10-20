'use client';

import React from 'react';
import { Search, CalendarDays, UserCheck, X } from 'lucide-react';
import { useT } from '@/lib/useT';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';
import type { BookingStats, BookingStatusFilter, BookingViewMode } from './bookingsGrouping';

// The Bookings tab's top bar: view switcher, search box and status filter chips.
export default function BookingsToolbar({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  stats,
  bookingsCount,
}: {
  viewMode: BookingViewMode;
  setViewMode: (mode: BookingViewMode) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: BookingStatusFilter;
  setStatusFilter: (filter: BookingStatusFilter) => void;
  stats: BookingStats;
  bookingsCount: number;
}) {
  const t = useT(TUTOR_DASHBOARD_COPY);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('by_student')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'by_student'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('byStudent')}</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono">
              {stats.studentCount}
            </span>
          </button>

          <button
            onClick={() => setViewMode('by_date')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'by_date'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-purple-600" />
            <span>{t('byDate')}</span>
            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-mono">
              {stats.total}
            </span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchBookings')}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-400 text-[11px] me-1">{t('statusLabel')}</span>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white font-bold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {t('all')} ({bookingsCount})
        </button>

        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'PENDING'
              ? 'bg-amber-600 text-white font-bold'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
          }`}
        >
          {t('statusPending')}
          {stats.pending > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setStatusFilter('CONFIRMED')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'CONFIRMED'
              ? 'bg-emerald-600 text-white font-bold'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {t('filterConfirmed')} ({stats.confirmed})
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'COMPLETED'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          }`}
        >
          {t('filterCompleted')} ({stats.completed})
        </button>

        <button
          onClick={() => setStatusFilter('CANCELLED')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'CANCELLED'
              ? 'bg-rose-600 text-white font-bold'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {t('filterCancelled')}
        </button>
      </div>
    </div>
  );
}
