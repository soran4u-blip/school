import { describe, it, expect, beforeEach } from 'vitest';
import { isCooldownActive, markSubmitted } from './spamGuard';

describe('spamGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reports no cooldown before anything was submitted', () => {
    expect(isCooldownActive('review')).toBe(false);
  });

  it('reports an active cooldown immediately after a submission', () => {
    markSubmitted('review');
    expect(isCooldownActive('review')).toBe(true);
  });

  it('keys are independent of each other', () => {
    markSubmitted('review');
    expect(isCooldownActive('inquiry')).toBe(false);
  });
});
