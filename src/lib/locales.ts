import type { SupportedLanguage } from '@/core/types/masterData';

// The one place that knows what a language *is*: its direction, <html lang>, Intl tag, URL prefix
// and hreflang. Everything else (LanguageContext, localeHref, metadata, sitemap, formatters) reads
// from here instead of comparing `language === 'en'`, so a new language is a config entry rather
// than a hunt through the codebase.
export interface LocaleConfig {
  dir: 'rtl' | 'ltr';
  htmlLang: string;
  intl: string;
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
  ku: { dir: 'rtl', htmlLang: 'ckb', intl: 'ar-IQ', prefix: '/ku', hreflang: 'ckb', nativeName: 'کوردی', shortName: 'کوردی' },
};

export const SUPPORTED_LANGUAGES = Object.keys(LOCALES) as SupportedLanguage[];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'ar';

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LOCALES, value);
}

/**
 * The BCP-47 tag to hand to Intl.* for a language; unknown values read as the default.
 * Sorani deliberately formats with ar-IQ rather than ckb-IQ: ICU `ckb` data is missing from some
 * runtimes (trimmed Chromium/Electron builds) and present in others (Node), so the server and the
 * client rendered different month names and hydration failed. ar-IQ is available everywhere and
 * gives the same Arabic script and digits Sorani readers use; the cost is Arabic month names.
 */
export function intlLocale(language: string): string {
  return isSupportedLanguage(language) ? LOCALES[language].intl : LOCALES[DEFAULT_LANGUAGE].intl;
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
