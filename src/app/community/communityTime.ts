import type { SupportedLanguage } from '@/core/types/masterData';
import { intlLocale } from '@/lib/locales';
import { translate } from '@/lib/useT';
import { COMMUNITY_COPY } from './Community.i18n';

// "5m ago" / "منذ ٥ دقائق" / "٥ خولەک لەمەوبەر". Arabic and Sorani pick a different phrase for one,
// two, a few and many; English only has minutes, hours and days.
export function formatTimeAgo(isoString: string, language: SupportedLanguage): string {
  const say = (key: keyof typeof COMMUNITY_COPY, n?: number) =>
    translate(COMMUNITY_COPY, key, language, n === undefined ? undefined : { n });
  try {
    const diff = Math.max(0, Date.now() - new Date(isoString).getTime());
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return say('justNow');
    if (minutes < 60) return say('minutesAgo', minutes);

    if (language === 'en') {
      if (hours < 24) return say('hoursMany', hours);
      if (days === 1) return say('yesterday');
      if (days < 30) return say('daysMany', days);
      return new Date(isoString).toLocaleDateString(intlLocale(language), { month: 'short', day: 'numeric' });
    }

    if (hours === 1) return say('hourAgo');
    if (hours === 2) return say('twoHoursAgo');
    if (hours < 11) return say('hoursFew', hours);
    if (hours < 24) return say('hoursMany', hours);
    if (days === 1) return say('yesterday');
    if (days === 2) return say('twoDaysAgo');
    if (days < 11) return say('daysFew', days);
    return say('daysMany', days);
  } catch {
    return say('recently');
  }
}
