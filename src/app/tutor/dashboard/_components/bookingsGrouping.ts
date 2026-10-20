import { Booking } from '@/core/types/booking';

export type BookingViewMode = 'by_student' | 'by_date';
export type BookingStatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface StudentGroup {
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

export interface BookingStats {
  total: number;
  studentCount: number;
  pending: number;
  confirmed: number;
  completed: number;
}

// Filter bookings by status and search query (matches student name, phone, or date).
export function filterBookings(bookings: Booking[], statusFilter: BookingStatusFilter, searchQuery: string): Booking[] {
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
}

// Group filtered bookings by student, ordered so the ones needing action come first.
export function buildStudentGroups(
  filteredBookings: Booking[],
  isThreadUnread: (bookingId: string) => boolean,
  todayStr: string,
  unassignedLabel: string,
): StudentGroup[] {
    const map = new Map<string, StudentGroup>();

    for (const booking of filteredBookings) {
      const participants =
        booking.participants && booking.participants.length > 0
          ? booking.participants
          : [{ studentId: 'unknown', name: unassignedLabel, phone: '' }];

      for (const p of participants) {
        const key = p.studentId || p.phone || p.name || 'unknown';
        if (!map.has(key)) {
          map.set(key, {
            key,
            studentId: p.studentId || '',
            name: p.name || unassignedLabel,
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
}

// Overall counts across ALL bookings (not just filtered).
export function computeBookingStats(bookings: Booking[]): BookingStats {
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
}
