import { describe, it, expect } from 'vitest';
import { cn, formatCurrencyIQD, formatCurrencyUSD, formatCurrency, formatDate, todayLocalDate } from './utils';

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatCurrencyIQD', () => {
  it('formats using the Iraqi dinar currency symbol', () => {
    expect(formatCurrencyIQD(35000)).toContain('د.ع');
  });
});

describe('formatCurrencyUSD', () => {
  it('formats using USD symbol', () => {
    expect(formatCurrencyUSD(1200)).toContain('$');
  });
});

describe('formatCurrency', () => {
  // The public institution pages used to hardcode '$', so a school priced in dinars had its
  // tuition published as dollars.
  it('honours the currency it is given rather than assuming dollars', () => {
    expect(formatCurrency(5000000, 'IQD')).toContain('د.ع');
    expect(formatCurrency(5000000, 'IQD')).not.toContain('$');
    expect(formatCurrency(5000, 'USD')).toContain('$');
  });
});

describe('todayLocalDate', () => {
  it('returns the local calendar day, not the UTC one', () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    expect(todayLocalDate()).toBe(expected);
  });

  it('matches YYYY-MM-DD', () => {
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDate', () => {
  it('renders the same calendar day it was given, regardless of timezone offset', () => {
    // Anchored at noon precisely so a negative UTC offset can't roll it back to the 14th.
    expect(formatDate('2026-09-15', 'en')).toContain('15');
    expect(formatDate('2026-09-15', 'en')).toContain('Sep');
  });

  it('accepts a full ISO timestamp, not just a date', () => {
    expect(formatDate('2026-09-15T08:30:00.000Z', 'en')).toContain('15');
  });
});
