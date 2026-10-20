import type { Metadata } from 'next';
import type { SupportedLanguage } from '@/core/types/masterData';
import { LOCALES, SUPPORTED_LANGUAGES } from '@/lib/locales';
import { localeHref } from '@/lib/locale';
import { siteUrl } from '@/lib/siteUrl';

/** Absolute URL of `path` (an unprefixed public path such as '/tutors/ali') in a language. */
export function absoluteLocaleUrl(path: string, language: SupportedLanguage): string {
  const href = localeHref(path, language);
  return href === '/' ? siteUrl : `${siteUrl}${href}`;
}

/**
 * hreflang -> absolute URL for every language's version of a page, plus x-default (the Arabic,
 * unprefixed one). Search engines only honour hreflang when every version lists all the others,
 * so every locale of a page — Arabic, /en and /ku — must emit this same map.
 */
export function hreflangUrls(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const code of SUPPORTED_LANGUAGES) {
    languages[LOCALES[code].hreflang] = absoluteLocaleUrl(path, code);
  }
  languages['x-default'] = absoluteLocaleUrl(path, 'ar');
  return languages;
}

/** canonical + hreflang for the `language` version of `path`. */
export function localeAlternates(path: string, language: SupportedLanguage): NonNullable<Metadata['alternates']> {
  return { canonical: localeHref(path, language), languages: hreflangUrls(path) };
}

interface PageCopy {
  title: string;
  description?: string;
}

/** Metadata for a mirrored route whose only per-language parts are its title and description. */
export function buildLocaleMetadata(language: SupportedLanguage, path: string, copy: PageCopy): Metadata {
  return {
    title: copy.title,
    ...(copy.description ? { description: copy.description } : {}),
    alternates: localeAlternates(path, language),
  };
}

// Breadcrumb and not-found wording used by the detail-page layouts' JSON-LD / metadata.
export const SEO_LABELS: Record<SupportedLanguage, Record<'home' | 'explore' | 'tutors' | 'jobs', string>> = {
  ar: { home: 'الرئيسية', explore: 'استكشف', tutors: 'الأساتذة', jobs: 'الوظائف' },
  en: { home: 'Home', explore: 'Explore', tutors: 'Tutors', jobs: 'Jobs' },
  ku: { home: 'سەرەکی', explore: 'گەڕان', tutors: 'مامۆستایان', jobs: 'هەلی کار' },
};

export const NOT_FOUND_TITLES: Record<SupportedLanguage, Record<'tutor' | 'institution' | 'job', string>> = {
  ar: { tutor: 'المدرّس غير موجود', institution: 'المؤسسة غير موجودة', job: 'الوظيفة غير موجودة' },
  en: { tutor: 'Tutor Not Found', institution: 'Institution Not Found', job: 'Job Not Found' },
  ku: { tutor: 'مامۆستا نەدۆزرایەوە', institution: 'دامەزراوە نەدۆزرایەوە', job: 'هەلی کار نەدۆزرایەوە' },
};
