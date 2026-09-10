'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  User,
  MessageCircle,
  Phone,
  Check,
  ListChecks,
  UserX,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Search,
  CheckCheck,
  CalendarDays,
  UserCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/core/context/LanguageContext';
import { Booking } from '@/core/types/booking';
import MessageThreadPanel from '@/components/shared/MessageThreadPanel';
import { MessageThreads } from '@/lib/useMessageThreads';

interface StudentGroup {
  key: string;
  studentId: string;
  name: string;
  phone: string;
  bookings: Booking[];
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  nextSession?: Booking;
  hasUnread: boolean;
}

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
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'by_student' | 'by_date'>('by_student');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});
  const [batchLoadingStudentId, setBatchLoadingStudentId] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter bookings by status and search query
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter === 'CANCELLED') {
        if (b.status !== 'CANCELLED' && b.status !== 'NO_SHOW') return false;
      } else if (statusFilter !== 'ALL') {
        if (b.status !== statusFilter) return false;
      }

      // Search query filter (matches student name, phone, or date)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const dateMatch = b.date.toLowerCase().includes(query);
        const participantMatch = b.participants?.some(
          (p) => p.name?.toLowerCase().includes(query) || p.phone?.toLowerCase().includes(query)
        );
        if (!dateMatch && !participantMatch) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, searchQuery]);

  // Group filtered bookings by student
  const studentGroups = useMemo(() => {
    const map = new Map<string, StudentGroup>();

    for (const booking of filteredBookings) {
      const participants =
        booking.participants && booking.participants.length > 0
          ? booking.participants
          : [{ studentId: 'unknown', name: t('غير محدد', 'Unassigned'), phone: '' }];

      for (const p of participants) {
        const key = p.studentId || p.phone || p.name || 'unknown';
        if (!map.has(key)) {
          map.set(key, {
            key,
            studentId: p.studentId || '',
            name: p.name || t('غير محدد', 'Unassigned'),
            phone: p.phone || '',
            bookings: [],
            pendingCount: 0,
            confirmedCount: 0,
            completedCount: 0,
            cancelledCount: 0,
            hasUnread: false,
          });
        }

        const group = map.get(key)!;
        group.bookings.push(booking);

        if (booking.status === 'PENDING') group.pendingCount += 1;
        else if (booking.status === 'CONFIRMED') group.confirmedCount += 1;
        else if (booking.status === 'COMPLETED') group.completedCount += 1;
        else if (booking.status === 'CANCELLED' || booking.status === 'NO_SHOW') group.cancelledCount += 1;

        if (isThreadUnread(booking.id)) {
          group.hasUnread = true;
        }
      }
    }

    const groups = Array.from(map.values());

    // Sort bookings inside each student group by date & time ascending
    for (const group of groups) {
      group.bookings.sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

      // Find next upcoming active session
      const upcoming = group.bookings.find(
        (b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && b.date >= todayStr
      );
      group.nextSession = upcoming || group.bookings[0];
    }

    // Sort student groups:
    // 1. Students with pending requests first (needs action!)
    // 2. Students with unread messages next
    // 3. Earliest upcoming session
    // 4. Alphabetical by name
    groups.sort((a, b) => {
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (b.pendingCount > 0 && a.pendingCount === 0) return 1;

      if (a.hasUnread && !b.hasUnread) return -1;
      if (b.hasUnread && !a.hasUnread) return 1;

      const aNext = a.nextSession ? `${a.nextSession.date} ${a.nextSession.startTime}` : '9999';
      const bNext = b.nextSession ? `${b.nextSession.date} ${b.nextSession.startTime}` : '9999';
      if (aNext !== bNext) return aNext.localeCompare(bNext);

      return a.name.localeCompare(b.name);
    });

    return groups;
  }, [filteredBookings, isThreadUnread, todayStr, t]);

  // Overall counts across ALL bookings (not just filtered)
  const stats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    const uniqueStudents = new Set<string>();

    for (const b of bookings) {
      if (b.status === 'PENDING') pending += 1;
      else if (b.status === 'CONFIRMED') confirmed += 1;
      else if (b.status === 'COMPLETED') completed += 1;

      for (const p of b.participants || []) {
        uniqueStudents.add(p.studentId || p.phone || p.name);
      }
    }

    return {
      total: bookings.length,
      studentCount: uniqueStudents.size,
      pending,
      confirmed,
      completed,
    };
  }, [bookings]);

  const toggleStudent = (key: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isStudentExpanded = (key: string, hasPending: boolean) => {
    if (expandedStudents[key] !== undefined) {
      return expandedStudents[key];
    }
    return hasPending || studentGroups.length === 1;
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

  const renderBookingCard = (booking: Booking) => (
    <div
      key={booking.id}
      className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-colors space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {booking.type === 'GROUP' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                <Users className="w-3 h-3" />
                {t(`مجموعة (${booking.participants.length}/${booking.maxGroupSize})`, `Group (${booking.participants.length}/${booking.maxGroupSize})`)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
                <User className="w-3 h-3" />
                {t('فردي', '1-on-1')}
              </span>
            )}

            <span className="font-bold text-sm text-slate-900 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {booking.date}
            </span>

            <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {booking.startTime}–{booking.endTime}
            </span>

            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                booking.status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : booking.status === 'COMPLETED'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : booking.status === 'CANCELLED' || booking.status === 'NO_SHOW'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/60 animate-pulse'
              }`}
            >
              {booking.status === 'PENDING' ? t('قيد الانتظار', 'Pending') :
               booking.status === 'CONFIRMED' ? t('مؤكد', 'Confirmed') :
               booking.status === 'COMPLETED' ? t('مكتمل', 'Completed') :
               booking.status === 'CANCELLED' ? t('ملغي', 'Cancelled') :
               booking.status === 'NO_SHOW' ? t('لم يحضر', 'No Show') : booking.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="font-bold font-mono text-slate-800">
              {booking.pricePerStudent.iqd.toLocaleString()} IQD
            </span>
            {booking.participants && booking.participants.length > 1 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-[11px]">
                {booking.participants.map((p, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" />
                    {p.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => threads.toggle(booking.id)}
            className={`relative p-2 rounded-lg transition-colors ${
              threads.expandedId === booking.id
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
            title={t('مراسلة بخصوص هذا الموعد', 'Message about this session')}
          >
            <MessageCircle className="w-4 h-4" />
            {isThreadUnread(booking.id) && (
              <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />
            )}
          </button>

          {booking.status === 'PENDING' && (
            <button
              onClick={() => handleBookingStatus(booking, 'CONFIRMED')}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
              title={t('تأكيد هذا الموعد', 'Confirm this session')}
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {booking.status === 'CONFIRMED' && (
            <>
              <button
                onClick={() => handleBookingStatus(booking, 'COMPLETED')}
                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors"
                title={t('اكتملت الجلسة', 'Mark Completed')}
              >
                <ListChecks className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBookingStatus(booking, 'NO_SHOW')}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title={t('لم يحضر الطالب', 'Mark No-show')}
              >
                <UserX className="w-4 h-4" />
              </button>
            </>
          )}

          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button
              onClick={() => {
                if (
                  booking.status === 'CONFIRMED' &&
                  !confirm(
                    t(
                      'هذا الحجز مؤكد بالفعل. هل تريد إلغاءه فعلاً؟',
                      'This booking is already confirmed. Cancel it anyway?'
                    )
                  )
                ) {
                  return;
                }
                handleBookingStatus(booking, 'CANCELLED');
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors"
              title={t('إلغاء الموعد', 'Cancel Session')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {threads.expandedId === booking.id && (
        <div className="pt-2 border-t border-slate-200">
          <MessageThreadPanel threadId={booking.id} threads={threads} ownRole="tutor" />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top Toolbar: View Switcher, Search, and Status Filters */}
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
              <span>{t('حسب الطالب', 'By Student')}</span>
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
              <span>{t('حسب الموعد', 'By Date')}</span>
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
              placeholder={t('بحث عن طالب أو هاتف أو تاريخ...', 'Search student, phone, date...')}
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
          <span className="text-slate-400 text-[11px] me-1">{t('الحالة:', 'Status:')}</span>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('الكل', 'All')} ({bookings.length})
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {t('قيد الانتظار', 'Pending')}
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
            {t('مؤكدة', 'Confirmed')} ({stats.confirmed})
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'COMPLETED'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {t('مكتملة', 'Completed')} ({stats.completed})
          </button>

          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            {t('ملغاة / لم يحضر', 'Cancelled / No-show')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">
            {bookings.length === 0
              ? t('لا توجد حجوزات بعد', 'No bookings yet')
              : t('لا توجد حجوزات تطابق البحث أو الفلتر المختار', 'No bookings match your filter or search')}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {bookings.length === 0
              ? t('ستظهر حجوزات الطلاب هنا فور تأكيدها', 'Student bookings will appear here once requested')
              : t('جرب تغيير الفلتر أو إزالة كلمة البحث', 'Try changing the status filter or clearing your search')}
          </p>
        </div>
      ) : viewMode === 'by_student' ? (
        /* Accordion: Grouped by Student */
        <div className="space-y-3">
          {studentGroups.map((group) => {
            const hasPending = group.pendingCount > 0;
            const expanded = isStudentExpanded(group.key, hasPending);
            const isBatchLoading = batchLoadingStudentId === group.key;

            return (
              <div
                key={group.key}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                  hasPending ? 'border-amber-300/80 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                {/* Student Header / Collapsible Trigger */}
                <div
                  onClick={() => toggleStudent(group.key)}
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
                            {t('رسائل جديدة', 'New message')}
                          </span>
                        )}
                      </div>

                      {/* Summary Badges & Next Session */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {group.bookings.length} {t('جلسة / موعد', 'sessions')}
                        </span>
                        <span>•</span>
                        {group.nextSession && (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {t('الموعد القادم:', 'Next:')}{' '}
                            <span className="font-bold text-slate-800">{group.nextSession.date}</span> (
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
                        {group.pendingCount} {t('بانتظار التأكيد', 'pending approval')}
                      </span>
                    )}

                    {/* Batch Confirm Button */}
                    {hasPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBatchConfirm(group);
                        }}
                        disabled={isBatchLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors disabled:opacity-50"
                        title={t('تأكيد جميع الحجوزات المعلقة لهذا الطالب', 'Confirm all pending sessions for this student')}
                      >
                        {isBatchLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{t(`تأكيد الكل (${group.pendingCount})`, `Confirm All (${group.pendingCount})`)}</span>
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
                        {t('جميع المواعيد والجلسات', 'All Scheduled Sessions')} ({group.bookings.length})
                      </span>
                      <div className="flex gap-2 text-[11px] text-slate-400">
                        {group.confirmedCount > 0 && (
                          <span className="text-emerald-700">{group.confirmedCount} {t('مؤكدة', 'confirmed')}</span>
                        )}
                        {group.completedCount > 0 && (
                          <span className="text-blue-700">{group.completedCount} {t('مكتملة', 'completed')}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.bookings.map((booking) => renderBookingCard(booking))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat View: Chronological / By Date */
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs divide-y divide-slate-100 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('المواعيد حسب التاريخ والوقت', 'Sessions Chronological Order')} ({filteredBookings.length})
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {[...filteredBookings]
              .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
              .map((booking) => renderBookingCard(booking))}
          </div>
        </div>
      )}
    </div>
  );
}
