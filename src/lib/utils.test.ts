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
  it('formats using the Iraqi dinar currency symbol in Arabic', () => {
    expect(formatCurrencyIQD(35000, 'ar')).toContain('د.ع');
  });

  // It used to hardcode the ar-IQ locale, so an English reader was shown Arabic-Indic digits.
  it('uses Latin digits and an IQD label in English', () => {
    const formatted = formatCurrencyIQD(1800000, 'en');
    expect(formatted).toContain('IQD');
    expect(formatted).toContain('1,800,000');
    expect(formatted).not.toMatch(/[٠-٩]/);
  });
});

describe('currency direction marks', () => {
  it.each(['ar', 'ku'])('emits no invisible bidi marks for %s, so server and client output match', (language) => {
    expect(formatCurrencyIQD(35000, language)).not.toMatch(/[\u200E\u200F\u061C]/);
    expect(formatCurrency(35000, 'USD', language)).not.toMatch(/[\u200E\u200F\u061C]/);
  });
});

describe('formatCurrencyUSD', () => {
  it('formats using USD symbol', () => {
    expect(formatCurrencyUSD(1200, 'en')).toContain('$');
    expect(formatCurrencyUSD(1200, 'en')).toContain('1,200');
  });
});

describe('formatCurrency', () => {
  // The public institution pages used to hardcode '$', so a school priced in dinars had its
  // tuition published as dollars.
  it('honours the currency it is given rather than assuming dollars', () => {
    expect(formatCurrency(5000000, 'IQD', 'ar')).toContain('د.ع');
    expect(formatCurrency(5000000, 'IQD', 'ar')).not.toContain('$');
    expect(formatCurrency(5000, 'USD', 'en')).toContain('$');
  });

  it('follows the reader language for either currency', () => {
    // Intl separates the currency label with a non-breaking space, so the parts are asserted
    // separately rather than pinning an exact whitespace character.
    const english = formatCurrency(5000000, 'IQD', 'en');
    expect(english).toContain('IQD');
    expect(english).toContain('5,000,000');
    expect(formatCurrency(5000000, 'IQD', 'ar')).toMatch(/[٠-٩]/);
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
