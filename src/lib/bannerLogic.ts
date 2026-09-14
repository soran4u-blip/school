import { CMSBanner } from '@/core/types/masterData';

// Whether a banner is eligible to be shown today: the manual switch and both date bounds all have
// to allow it. Shared by the cached public read (core/server/data/masterData.ts) and the admin
// list page (which shows an "active today" pill per row using the same rule).
export function isBannerActive(banner: Pick<CMSBanner, 'isActive' | 'startDate' | 'endDate'>, today: string): boolean {
  if (!banner.isActive) return false;
  if (banner.startDate && today < banner.startDate) return false;
  if (banner.endDate && today > banner.endDate) return false;
  return true;
}

// One weighted-random pick from a list of already-eligible banners — the rotation itself. `random`
// is injectable so a test can assert on specific bands of the [0,1) range instead of statistically
// sampling live randomness.
export function pickWeightedBanner(banners: CMSBanner[], random: () => number = Math.random): CMSBanner | null {
  if (banners.length === 0) return null;
  const totalWeight = banners.reduce((sum, b) => sum + Math.max(b.weight, 0), 0);
  if (totalWeight <= 0) return banners[0];

  let r = random() * totalWeight;
  for (const banner of banners) {
    r -= Math.max(banner.weight, 0);
    if (r < 0) return banner;
  }
  return banners[banners.length - 1];
}
