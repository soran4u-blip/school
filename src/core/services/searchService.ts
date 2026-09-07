import { Institution } from '../types/institution';
import { Tutor } from '../types/tutor';
import { TaxonomyItem } from '../types/masterData';

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
  language: 'ar' | 'en' | 'ku' = 'en'
): SearchSuggestion[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: SearchSuggestion[] = [];

  for (const inst of data.institutions) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (inst.name.ar.toLowerCase().includes(q) || inst.name.en.toLowerCase().includes(q)) {
      results.push({
        type: 'institution',
        id: inst.id,
        label: language === 'en' ? inst.name.en : inst.name.ar,
        sublabel: language === 'en' ? inst.address.en : inst.address.ar,
        href: `/institutions/${inst.slug}`,
      });
    }
  }

  for (const tutor of data.tutors) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (tutor.fullName.ar.toLowerCase().includes(q) || tutor.fullName.en.toLowerCase().includes(q)) {
      results.push({
        type: 'tutor',
        id: tutor.id,
        label: language === 'en' ? tutor.fullName.en : tutor.fullName.ar,
        sublabel: language === 'en' ? tutor.title.en : tutor.title.ar,
        href: `/tutors/${tutor.id}`,
      });
    }
  }

  for (const subject of data.subjects) {
    if (results.length >= MAX_SUGGESTIONS) break;
    if (subject.name.ar.toLowerCase().includes(q) || subject.name.en.toLowerCase().includes(q)) {
      results.push({
        type: 'subject',
        id: subject.id,
        label: language === 'en' ? subject.name.en : subject.name.ar,
        href: `/explore?q=${encodeURIComponent(subject.name.en)}`,
      });
    }
  }

  return results.slice(0, MAX_SUGGESTIONS);
}
