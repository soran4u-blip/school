import type { LocalizedString, SupportedLanguage } from '@/core/types/masterData';
import { normalizeSearchText } from '@/lib/textNormalize';

// Fallback order per language. Kurdish readers read Arabic script, so a missing Sorani value
// falls back to Arabic before English; the others try the remaining languages so a half-filled
// record never renders blank.
const FALLBACK_ORDER: Record<SupportedLanguage, SupportedLanguage[]> = {
  ku: ['ku', 'ar', 'en'],
  ar: ['ar', 'en', 'ku'],
  en: ['en', 'ar', 'ku'],
};

/**
 * The reader's-language text of a LocalizedString, falling back as above. Use this instead of
 * `language === 'en' ? x.en : x.ar`, which treats every other language as Arabic and ignores `ku`.
 */
export function pickLocalized(
  value: Partial<LocalizedString> | null | undefined,
  language: SupportedLanguage,
): string {
  if (!value) return '';
  for (const lang of FALLBACK_ORDER[language]) {
    const text = value[lang];
    if (typeof text === 'string' && text.trim()) return text;
  }
  return '';
}

/**
 * Whether any language's text of a LocalizedString contains an already-normalized query
 * (see normalizeSearchText). Searches every language, not just the reader's, so an Arabic search
 * still finds a record whose Sorani name was typed in first.
 */
export function matchesLocalized(value: Partial<LocalizedString> | null | undefined, normalizedQuery: string): boolean {
  if (!value) return false;
  return (['ar', 'en', 'ku'] as const).some((lang) => {
    const text = value[lang];
    return typeof text === 'string' && normalizeSearchText(text).includes(normalizedQuery);
  });
}
