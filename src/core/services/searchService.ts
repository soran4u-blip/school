import { Institution } from '../types/institution';
import { Tutor } from '../types/tutor';
import { SupportedLanguage, TaxonomyItem } from '../types/masterData';
import { localeHref } from '@/lib/locale';
import { matchesLocalized, pickLocalized } from '@/lib/localized';
import { normalizeSearchText } from '@/lib/textNormalize';

export interface SearchSuggestion {
  type: 'institution' | 'tutor' | 'subject';
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

const MAX_SUGGESTIONS = 8;

// Grouped autocomplete suggestions across institutions, tutors, and subjects — plain substring
// matching over already-loaded lists, same convention as every other keyword filter in this
// codebase (no fuzzy search library, no server round-trip per keystroke).
export function getSearchSuggestions(
  query: string,
  data: { institutions: Institution[]; tutors: Tutor[]; subjects: TaxonomyItem[] },
  language: SupportedLanguage = 'en'
): SearchSuggestion[] {
  const q = normalizeSearchText(query);
  if (!q) return [];

  const results: SearchSuggestion[] = [];

  for (const inst of data.institutions) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (matchesLocalized(inst.name, q)) {
      results.push({
        type: 'institution',
        id: inst.id,
        label: pickLocalized(inst.name, language),
        sublabel: pickLocalized(inst.address, language),
        href: localeHref(`/institutions/${inst.slug}`, language),
      });
    }
  }

  for (const tutor of data.tutors) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (matchesLocalized(tutor.fullName, q)) {
      results.push({
        type: 'tutor',
        id: tutor.id,
        label: pickLocalized(tutor.fullName, language),
        sublabel: pickLocalized(tutor.title, language),
        href: localeHref(`/tutors/${tutor.slug || tutor.id}`, language),
      });
    }
  }

  for (const subject of data.subjects) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (matchesLocalized(subject.name, q)) {
      results.push({
        type: 'subject',
        id: subject.id,
        label: pickLocalized(subject.name, language),
        href: `${localeHref('/explore', language)}?q=${encodeURIComponent(subject.name.en)}`,
      });
    }
  }

  return results.slice(0, MAX_SUGGESTIONS);
}
