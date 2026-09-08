import { describe, it, expect } from 'vitest';
import { dayOfWeekFromDate, addDaysToDateString, isWithinAvailability } from './bookingLogic';

describe('dayOfWeekFromDate', () => {
  it('resolves a known Sunday', () => {
    expect(dayOfWeekFromDate('2026-09-06')).toBe(0);
  });

  it('resolves a known Monday', () => {
    expect(dayOfWeekFromDate('2026-09-07')).toBe(1);
  });

  it('is stable across a year boundary', () => {
    expect(dayOfWeekFromDate('2026-01-01')).toBe(4); // Thursday
  });
});

describe('addDaysToDateString', () => {
  it('adds whole weeks without drifting', () => {
    expect(addDaysToDateString('2026-09-07', 7)).toBe('2026-09-14');
  });

  it('rolls over a month boundary', () => {
    expect(addDaysToDateString('2026-09-28', 7)).toBe('2026-10-05');
  });

  it('rolls over a year boundary', () => {
    expect(addDaysToDateString('2026-12-28', 7)).toBe('2027-01-04');
  });
});

describe('isWithinAvailability', () => {
  const tutor = {
    availability: [
      { dayOfWeek: 1 as const, startTime: '09:00', endTime: '12:00' },
      { dayOfWeek: 3 as const, startTime: '14:00', endTime: '16:00' },
    ],
  };

  it('accepts a slot fully inside an availability window', () => {
    expect(isWithinAvailability(tutor, 1, '09:00', '10:00')).toBe(true);
  });

  it('rejects a slot on a day with no availability', () => {
    expect(isWithinAvailability(tutor, 2, '09:00', '10:00')).toBe(false);
  });

  it('rejects a slot that extends past the availability window', () => {
    expect(isWithinAvailability(tutor, 1, '11:00', '13:00')).toBe(false);
  });

  it('rejects a slot that starts before the availability window', () => {
    expect(isWithinAvailability(tutor, 3, '13:00', '15:00')).toBe(false);
  });
});
