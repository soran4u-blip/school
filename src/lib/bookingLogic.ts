import { Tutor } from '@/core/types/tutor';

// Treat "YYYY-MM-DD" as a plain calendar date, not a timezone-sensitive instant — parsing it as
// local time (or as `Z`/UTC-instant then reading local fields) can give a different weekday than
// the client intended depending on server timezone. Date.UTC + getUTCDay reads back exactly the
// same field we wrote in.
export function dayOfWeekFromDate(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

// Same UTC-anchored approach as dayOfWeekFromDate, so adding whole weeks never drifts across a
// server-timezone boundary the way local-time date math could.
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function isWithinAvailability(tutor: Pick<Tutor, 'availability'>, dayOfWeek: number, startTime: string, endTime: string): boolean {
  return (tutor.availability || []).some(
    (slot) => slot.dayOfWeek === dayOfWeek && startTime >= slot.startTime && endTime <= slot.endTime
  );
}
