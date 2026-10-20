const STORAGE_KEY = 'eduraq-shortlist';
export const EMPTY_SHORTLIST: string[] = [];
let cachedShortlist: string[] | null = null;

export function readShortlist(): string[] {
  if (typeof window === 'undefined') return EMPTY_SHORTLIST;
  if (cachedShortlist) return cachedShortlist;
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    cachedShortlist = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    cachedShortlist = [];
  }
  return cachedShortlist;
}

export function writeShortlist(ids: string[]): void {
  try {
    cachedShortlist = [...ids];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedShortlist));
    window.dispatchEvent(new CustomEvent('eduraq-shortlist-change'));
  } catch {
    // Local storage is an enhancement; the directory remains usable when it is unavailable.
  }
}

export function subscribeToShortlist(onChange: () => void): () => void {
  const handleChange = () => {
    cachedShortlist = null;
    onChange();
  };
  window.addEventListener('storage', handleChange);
  window.addEventListener('eduraq-shortlist-change', handleChange);
  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener('eduraq-shortlist-change', handleChange);
  };
}
