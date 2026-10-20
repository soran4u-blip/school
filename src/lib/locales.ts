import type { SupportedLanguage } from '@/core/types/masterData';

// The one place that knows what a language *is*: its direction, <html lang>, Intl tag, URL prefix
// and hreflang. Everything else (LanguageContext, localeHref, metadata, sitemap, formatters) reads
// from here instead of comparing `language === 'en'`, so a new language is a config entry rather
// than a hunt through the codebase.
export interface LocaleConfig {
  dir: 'rtl' | 'ltr';
  htmlLang: string;
  intl: string;
  /** Tried in order when the runtime has no Intl data for `intl` (see intlLocale). */
  intlFallbacks?: string[];
  /** URL prefix of the language's route tree; '' for the default (Arabic) unprefixed tree. */
  prefix: '' | '/en' | '/ku';
  hreflang: string;
  nativeName: string;
  /** Short label for compact switchers. */
  shortName: string;
}

export const LOCALES: Record<SupportedLanguage, LocaleConfig> = {
  ar: { dir: 'rtl', htmlLang: 'ar', intl: 'ar-IQ', prefix: '', hreflang: 'ar-IQ', nativeName: 'العربية', shortName: 'عربي' },
  en: { dir: 'ltr', htmlLang: 'en', intl: 'en-US', prefix: '/en', hreflang: 'en', nativeName: 'English', shortName: 'EN' },
  ku: { dir: 'rtl', htmlLang: 'ckb', intl: 'ckb-IQ', intlFallbacks: ['ar-IQ'], prefix: '/ku', hreflang: 'ckb', nativeName: 'کوردی', shortName: 'کوردی' },
};

export const SUPPORTED_LANGUAGES = Object.keys(LOCALES) as SupportedLanguage[];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ar';

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOCALES, value);
}

/**
 * The BCP-47 tags to hand to Intl.* for a language, best first; unknown values read as the default.
 * Every Intl constructor and toLocale*String accepts the list and uses the first tag the runtime
 * has data for. That matters for Sorani: some runtimes (e.g. Electron/Chromium builds with a
 * trimmed ICU) lack `ckb`, and a bare 'ckb-IQ' then silently formats as en-US ("Sep 16", "IQD 35,000").
 * Falling back to ar-IQ keeps the Arabic script and digits, which Sorani readers also use.
 */
export function intlLocale(language: string): string[] {
  const config = isSupportedLanguage(language) ? LOCALES[language] : LOCALES[DEFAULT_LANGUAGE];
  return [config.intl, ...(config.intlFallbacks ?? [])];
}

/**
 * The language a URL pins, or null for the unprefixed tree (which follows the saved preference).
 * Only whole path segments count: '/english-schools' is not '/en'.
 */
export function localeFromPathname(pathname: string): SupportedLanguage | null {
  for (const language of SUPPORTED_LANGUAGES) {
    const { prefix } = LOCALES[language];
    if (prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`))) return language;
  }
  return null;
}

/** '/ku/explore' -> '/explore', '/en' -> '/'; unprefixed paths come back unchanged. */
export function stripLocalePrefix(pathname: string): string {
  const language = localeFromPathname(pathname);
  if (!language) return pathname;
  return pathname.slice(LOCALES[language].prefix.length) || '/';
}
