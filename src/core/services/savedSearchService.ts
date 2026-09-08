import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { SavedSearch } from '../types/savedSearch';

export async function getSavedSearches(studentId: string): Promise<SavedSearch[]> {
  const q = query(collection(db, 'students', studentId, 'savedSearches'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedSearch));
}

export async function saveSearch(studentId: string, label: string, path: string): Promise<SavedSearch> {
  const ref = doc(collection(db, 'students', studentId, 'savedSearches'));
  const search: SavedSearch = { id: ref.id, label, path, createdAt: new Date().toISOString() };
  await setDoc(ref, search);
  return search;
}

export async function deleteSavedSearch(studentId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'students', studentId, 'savedSearches', id));
}
