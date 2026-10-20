// Arabic and Sorani share a script but spell the same sounds with different code points (Persian/
// Kurdish keyboards type ک and ی where Arabic ones type ك and ي, and Sorani adds ڕ ڵ ێ ۆ ە ڤ).
// Without folding them together, a search typed on a Kurdish keyboard misses Arabic-script content
// and vice versa. Applied to both the query and the searched text.
const LETTER_MAP: Record<string, string> = {
  'ك': 'ک',
  'ي': 'ی',
  'ى': 'ی',
  'ێ': 'ی',
  'ە': 'ه',
  'ۆ': 'و',
  'ڕ': 'ر',
  'ڵ': 'ل',
  'ڤ': 'ف',
  'ة': 'ه',
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
};

const TASHKEEL_AND_TATWEEL = /[ً-ٰٟـ]/g;

export function normalizeSearchText(text: string): string {
  return text
    .replace(TASHKEEL_AND_TATWEEL, '')
    .replace(/[كيىێەۆڕڵڤةأإآ]/g, (char) => LETTER_MAP[char] ?? char)
    .toLowerCase()
    .trim();
}
