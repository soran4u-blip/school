import { describe, it, expect } from 'vitest';
import { isBannerActive, pickWeightedBanner } from './bannerLogic';
import { CMSBanner } from '@/core/types/masterData';

function makeBanner(overrides: Partial<CMSBanner> = {}): CMSBanner {
  return {
    id: 'b1',
    title: { ar: '', en: '' },
    subtitle: { ar: '', en: '' },
    location: 'DIRECTORY_FEED',
    isActive: true,
    weight: 1,
    ...overrides,
  };
}

describe('isBannerActive', () => {
  const today = '2026-09-14';

  it('is active with no date bounds', () => {
    expect(isBannerActive(makeBanner(), today)).toBe(true);
  });

  it('is inactive when the manual switch is off, regardless of dates', () => {
    expect(isBannerActive(makeBanner({ isActive: false, startDate: '2026-01-01', endDate: '2027-01-01' }), today)).toBe(false);
  });

  it('respects a start date not yet reached', () => {
    expect(isBannerActive(makeBanner({ startDate: '2026-09-15' }), today)).toBe(false);
  });

  it('respects a start date already reached', () => {
    expect(isBannerActive(makeBanner({ startDate: '2026-09-14' }), today)).toBe(true);
  });

  it('respects an end date already passed', () => {
    expect(isBannerActive(makeBanner({ endDate: '2026-09-13' }), today)).toBe(false);
  });

  it('respects an end date not yet passed', () => {
    expect(isBannerActive(makeBanner({ endDate: '2026-09-14' }), today)).toBe(true);
  });

  it('is active within a full start/end range', () => {
    expect(isBannerActive(makeBanner({ startDate: '2026-09-01', endDate: '2026-09-30' }), today)).toBe(true);
  });
});

describe('pickWeightedBanner', () => {
  it('returns null for an empty list', () => {
    expect(pickWeightedBanner([])).toBeNull();
  });

  it('returns the only banner in a single-item list', () => {
    const banner = makeBanner();
    expect(pickWeightedBanner([banner], () => 0.5)).toBe(banner);
  });

  it('picks proportionally to weight', () => {
    const a = makeBanner({ id: 'a', weight: 50 });
    const b = makeBanner({ id: 'b', weight: 30 });
    const c = makeBanner({ id: 'c', weight: 20 });
    const banners = [a, b, c];

    // total weight 100: [0,50) -> a, [50,80) -> b, [80,100) -> c
    expect(pickWeightedBanner(banners, () => 0)).toBe(a);
    expect(pickWeightedBanner(banners, () => 0.49)).toBe(a);
    expect(pickWeightedBanner(banners, () => 0.5)).toBe(b);
    expect(pickWeightedBanner(banners, () => 0.79)).toBe(b);
    expect(pickWeightedBanner(banners, () => 0.8)).toBe(c);
    expect(pickWeightedBanner(banners, () => 0.99)).toBe(c);
  });

  it('falls back to the first banner when every weight is zero', () => {
    const a = makeBanner({ id: 'a', weight: 0 });
    const b = makeBanner({ id: 'b', weight: 0 });
    expect(pickWeightedBanner([a, b], () => 0.9)).toBe(a);
  });
});
