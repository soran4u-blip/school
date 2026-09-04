import { describe, it, expect } from 'vitest';
import { cn, formatCurrencyIQD, formatCurrencyUSD } from './utils';

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
