import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { SavedSearch, SavedSearchFilters } from '../types/savedSearch';

export async function getSavedSearches(studentId: string): Promise<SavedSearch[]> {
  const q = query(collection(db, 'students', studentId, 'savedSearches'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedSearch));
}

// `filters` is the authoritative record of what this search means; `path` is derived from it so
// the two can never disagree. Callers pass the filter state they built the label from, not the
// current URL — see the note on SavedSearchFilters.
export async function saveSearch(
  studentId: string,
  label: string,
  filters: SavedSearchFilters
): Promise<SavedSearch> {
  const ref = doc(collection(db, 'students', studentId, 'savedSearches'));
  const search: SavedSearch = {
    id: ref.id,
    label,
    filters,
    path: savedSearchPath(filters),
    createdAt: new Date().toISOString(),
  };
  await setDoc(ref, search);
  return search;
}

// Kept next to saveSearch so the link and the stored filters are built from one place.
export function savedSearchPath(filters: SavedSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.categoryId) params.set('category', filters.categoryId);
  if (filters.governorateId) params.set('governorate', filters.governorateId);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : '/explore';
}

export async function deleteSavedSearch(studentId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'students', studentId, 'savedSearches', id));
}
