const STORAGE_KEY = 'eduraq-shortlist';

export function readShortlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function writeShortlist(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('eduraq-shortlist-change'));
  } catch {
    // Local storage is an enhancement; the directory remains usable when it is unavailable.
  }
}

export function subscribeToShortlist(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener('eduraq-shortlist-change', onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener('eduraq-shortlist-change', onChange);
  };
}
