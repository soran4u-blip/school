import { describe, expect, it } from 'vitest';
import { LOCALES, intlLocale, isSupportedLanguage, localeFromPathname, stripLocalePrefix } from './locales';
import { localeHref, localizedPathFor } from './locale';
import { matchesLocalized, pickLocalized } from './localized';
import { normalizeSearchText } from './textNormalize';

describe('locales', () => {
  it('describes direction, html lang and Intl tag per language', () => {
    expect(LOCALES.ku).toMatchObject({ dir: 'rtl', htmlLang: 'ckb', intl: 'ckb-IQ', prefix: '/ku' });
    expect(LOCALES.en).toMatchObject({ dir: 'ltr', prefix: '/en' });
    expect(LOCALES.ar).toMatchObject({ dir: 'rtl', prefix: '' });
  });

  it('validates supported languages and falls back for unknown Intl locales', () => {
    expect(isSupportedLanguage('ku')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(isSupportedLanguage('toString')).toBe(false);
    expect(intlLocale('ku')).toEqual(['ckb-IQ', 'ar-IQ']);
    expect(intlLocale('en')).toEqual(['en-US']);
    expect(intlLocale('xx')).toEqual(['ar-IQ']);
  });

  it('pins a language only on whole path segments', () => {
    expect(localeFromPathname('/ku')).toBe('ku');
    expect(localeFromPathname('/ku/explore')).toBe('ku');
    expect(localeFromPathname('/en/tutors/a')).toBe('en');
    expect(localeFromPathname('/english-schools')).toBeNull();
    expect(localeFromPathname('/kurdish')).toBeNull();
    expect(localeFromPathname('/explore')).toBeNull();
  });

  it('strips the prefix', () => {
    expect(stripLocalePrefix('/ku')).toBe('/');
    expect(stripLocalePrefix('/ku/explore')).toBe('/explore');
    expect(stripLocalePrefix('/en/jobs/x')).toBe('/jobs/x');
    expect(stripLocalePrefix('/account')).toBe('/account');
  });
});

describe('localeHref / localizedPathFor', () => {
  it('prefixes per language', () => {
    expect(localeHref('/explore', 'ar')).toBe('/explore');
    expect(localeHref('/explore', 'en')).toBe('/en/explore');
    expect(localeHref('/explore', 'ku')).toBe('/ku/explore');
    expect(localeHref('/', 'ku')).toBe('/ku');
  });

  it('maps a mirrored page between languages and refuses private pages', () => {
    expect(localizedPathFor('/explore', 'ku')).toBe('/ku/explore');
    expect(localizedPathFor('/ku/explore', 'en')).toBe('/en/explore');
    expect(localizedPathFor('/en/tutors/ali', 'ar')).toBe('/tutors/ali');
    expect(localizedPathFor('/ku', 'ar')).toBe('/');
    expect(localizedPathFor('/', 'ku')).toBe('/ku');
    expect(localizedPathFor('/account', 'ku')).toBeNull();
    expect(localizedPathFor('/community', 'en')).toBeNull();
    expect(localizedPathFor('/admin/tutors', 'ku')).toBeNull();
  });
});

describe('pickLocalized', () => {
  const full = { ar: 'مدرسة', en: 'School', ku: 'قوتابخانە' };
  it('returns the reader language when present', () => {
    expect(pickLocalized(full, 'ku')).toBe('قوتابخانە');
    expect(pickLocalized(full, 'en')).toBe('School');
    expect(pickLocalized(full, 'ar')).toBe('مدرسة');
  });
  it('falls back ku -> ar -> en', () => {
    expect(pickLocalized({ ar: 'مدرسة', en: 'School' }, 'ku')).toBe('مدرسة');
    expect(pickLocalized({ ar: '', en: 'School', ku: ' ' }, 'ku')).toBe('School');
  });
  it('never renders blank when any language exists, and tolerates empty input', () => {
    expect(pickLocalized({ ar: '', en: '', ku: 'x' }, 'en')).toBe('x');
    expect(pickLocalized(undefined, 'ku')).toBe('');
    expect(pickLocalized(null, 'ar')).toBe('');
  });
});

describe('search normalisation', () => {
  it('folds Arabic and Sorani spellings together', () => {
    expect(normalizeSearchText('كوردستان')).toBe(normalizeSearchText('کوردستان'));
    expect(normalizeSearchText('عربي')).toBe(normalizeSearchText('عربی'));
    expect(normalizeSearchText('هەولێر')).toBe(normalizeSearchText('هەولیر'));
    expect(normalizeSearchText('مَدْرَسَة')).toBe(normalizeSearchText('مدرسه'));
    expect(normalizeSearchText('  Baghdad ')).toBe('baghdad');
  });
  it('matches across languages', () => {
    const name = { ar: 'جامعة السليمانية', en: 'University of Sulaimani', ku: 'زانکۆی سلێمانی' };
    expect(matchesLocalized(name, normalizeSearchText('سلێمانی'))).toBe(true);
    expect(matchesLocalized(name, normalizeSearchText('سليماني'))).toBe(true);
    expect(matchesLocalized(name, normalizeSearchText('sulaimani'))).toBe(true);
    expect(matchesLocalized(name, normalizeSearchText('هەولێر'))).toBe(false);
    expect(matchesLocalized(undefined, 'x')).toBe(false);
  });
});
