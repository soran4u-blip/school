'use client';

import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Booking } from '@/core/types/booking';
import { MessageThreads } from '@/lib/useMessageThreads';
import { todayLocalDate } from '@/lib/utils';
import BookingsToolbar from './BookingsToolbar';
import StudentGroupCard from './StudentGroupCard';
import { BookingStatusFilter, BookingViewMode, StudentGroup, buildStudentGroups, computeBookingStats, filterBookings } from './bookingsGrouping';
import BookingsCalendarView from './BookingsCalendarView';
import { useT } from '@/lib/useT';
import { TUTOR_DASHBOARD_COPY } from '../TutorDashboard.i18n';

export default function BookingsTab({
  bookings,
  handleBookingStatus,
  threads,
  isThreadUnread,
}: {
  bookings: Booking[];
  handleBookingStatus: (booking: Booking, status: Booking['status']) => void;
  threads: MessageThreads;
  isThreadUnread: (bookingId: string) => boolean;
}) {
  const t = useT(TUTOR_DASHBOARD_COPY);
  const [viewMode, setViewMode] = useState<BookingViewMode>('by_student');
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const [batchLoadingStudentId, setBatchLoadingStudentId] = useState<string | null>(null);

  // Local time, not UTC — `toISOString()` can read as tomorrow late at night in Iraq, which made
  // the agenda's "Today" grouping misleading.
  const todayStr = useMemo(() => todayLocalDate(), []);

  const filteredBookings = useMemo(() => filterBookings(bookings, statusFilter, searchQuery), [bookings, statusFilter, searchQuery]);

  const unassignedLabel = t('unassigned');
  const studentGroups = useMemo(
    () => buildStudentGroups(filteredBookings, isThreadUnread, todayStr, unassignedLabel),
    [filteredBookings, isThreadUnread, todayStr, unassignedLabel],
  );

  const stats = useMemo(() => computeBookingStats(bookings), [bookings]);

  const toggleStudent = (key: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? false),
    }));
  };

  // Collapsed by default; expanding a student is remembered for the rest of the session.
  const isStudentExpanded = (key: string) => {
    return expandedStudents[key] ?? false;
  };

  const handleBatchConfirm = async (group: StudentGroup) => {
    const pendingBookings = group.bookings.filter((b) => b.status === 'PENDING');
    if (pendingBookings.length === 0) return;

    setBatchLoadingStudentId(group.key);
    try {
      for (const b of pendingBookings) {
        await handleBookingStatus(b, 'CONFIRMED');
      }
    } finally {
      setBatchLoadingStudentId(null);
    }
  };

  return (
    <div className="space-y-4">
      <BookingsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stats={stats}
        bookingsCount={bookings.length}
      />

      {/* Main Content Area */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            {bookings.length === 0
              ? t('noBookings')
              : t('noBookingsMatch')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {bookings.length === 0
              ? t('noBookingsHint')
              : t('noBookingsMatchHint')}
          </p>
        </div>
      ) : viewMode === 'by_student' ? (
        /* Accordion: Grouped by Student */
        <div className="space-y-3">
          {studentGroups.map((group) => (
            <StudentGroupCard
              key={group.key}
              group={group}
              expanded={isStudentExpanded(group.key)}
              isBatchLoading={batchLoadingStudentId === group.key}
              onToggle={() => toggleStudent(group.key)}
              onBatchConfirm={() => handleBatchConfirm(group)}
              handleBookingStatus={handleBookingStatus}
              threads={threads}
              isThreadUnread={isThreadUnread}
            />
          ))}
        </div>
      ) : (
        <BookingsCalendarView
          bookings={bookings}
          filteredBookings={filteredBookings}
          todayStr={todayStr}
          handleBookingStatus={handleBookingStatus}
          threads={threads}
          isThreadUnread={isThreadUnread}
        />
      )}
    </div>
  );
}
