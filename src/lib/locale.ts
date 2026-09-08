import { SupportedLanguage } from '@/core/types/masterData';

// Prefixes a path with /en when the current locale is English. Only meaningful for the six
// route groups that have an /en mirror (home, explore, tutors, jobs, institutions, community) —
// links to anything else (account, dashboards, apply, admin) are locale-agnostic and should be
// passed through unchanged, not through this helper.
export function localeHref(path: string, language: SupportedLanguage): string {
  if (language !== 'en') return path;
  return path === '/' ? '/en' : `/en${path}`;
}
