import { SupportedLanguage } from '@/core/types/masterData';
import { LOCALES, stripLocalePrefix } from '@/lib/locales';

// Prefixes a path with the language's route-tree prefix (/en, /ku; none for Arabic). Only
// meaningful for the route groups that have a mirror (home, explore, tutors, jobs, events,
// institutions, trust, login, my-applications) — links to anything else (account, dashboards,
// apply, admin) are locale-agnostic and should be passed through unchanged, not through this
// helper.
export function localeHref(path: string, language: SupportedLanguage): string {
  const { prefix } = LOCALES[language];
  if (!prefix) return path;
  return path === '/' ? prefix : `${prefix}${path}`;
}

// Top-level segments that exist under every language prefix. Keep in sync with src/app/en and
// src/app/ku.
const MIRRORED_ROOTS = ['events', 'explore', 'institutions', 'jobs', 'login', 'my-applications', 'trust', 'tutors'];

function isMirroredPath(unprefixedPath: string): boolean {
  if (unprefixedPath === '/') return true;
  const root = unprefixedPath.split('/')[1];
  return MIRRORED_ROOTS.includes(root);
}

/**
 * Where the same page lives in another language, or null when the current page has no per-language
 * URL (account, dashboards, community, ...) — there the switcher only changes the saved preference.
 */
export function localizedPathFor(pathname: string, target: SupportedLanguage): string | null {
  const unprefixed = stripLocalePrefix(pathname);
  return isMirroredPath(unprefixed) ? localeHref(unprefixed, target) : null;
}
