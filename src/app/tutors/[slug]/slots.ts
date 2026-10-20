export interface SlotStatus {
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'INDIVIDUAL' | 'GROUP';
  currentSize: number;
  maxGroupSize: number;
  isFull: boolean;
  pricePerStudent: { iqd: number; usd: number };
}

export interface DaySlot {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function nextNDays(n: number): { date: string; dayOfWeek: number }[] {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    // Build the date string from local calendar fields (not toISOString, which
    // converts to UTC and can roll to a different calendar day than d.getDay()
    // reflects whenever the local timezone is ahead of UTC, e.g. late night in Iraq).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    out.push({ date: `${y}-${m}-${day}`, dayOfWeek: d.getDay() });
  }
  return out;
}
