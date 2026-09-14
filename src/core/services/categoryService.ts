import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Category, Subcategory } from '../types/masterData';
import { revalidateMasterDataCache } from './cacheRevalidation';

// Institution categories (universities, schools, institutes…) and their subcategories.
// Same shape and the same in-memory-filter reasoning as locationService.

const CATEGORIES = 'categories';
const SUBCATEGORIES = 'subcategories';

function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T): number {
  return a.displayOrder - b.displayOrder;
}

export async function getCategories(activeOnly = true): Promise<Category[]> {
  const snap = await getDocs(collection(db, CATEGORIES));
  const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Category);
  return (activeOnly ? list.filter((c) => c.isActive) : list).sort(byDisplayOrder);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const list = await getCategories(false);
  return list.find((c) => c.id === id) || null;
}

export async function saveCategory(cat: Category): Promise<Category> {
  await setDoc(doc(db, CATEGORIES, cat.id), cat, { merge: true });
  await revalidateMasterDataCache();
  return cat;
}

export async function deleteCategory(id: string): Promise<void> {
  const subs = await getDocs(collection(db, CATEGORIES, id, SUBCATEGORIES));
  await Promise.all(subs.docs.map((s) => deleteDoc(s.ref)));
  await deleteDoc(doc(db, CATEGORIES, id));
  await revalidateMasterDataCache();
}

export async function getSubcategories(categoryId: string, activeOnly = true): Promise<Subcategory[]> {
  const snap = await getDocs(collection(db, CATEGORIES, categoryId, SUBCATEGORIES));
  const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Subcategory);
  return (activeOnly ? list.filter((s) => s.isActive) : list).sort(byDisplayOrder);
}

export async function saveSubcategory(sub: Subcategory): Promise<Subcategory> {
  await setDoc(doc(db, CATEGORIES, sub.categoryId, SUBCATEGORIES, sub.id), sub, { merge: true });
  await revalidateMasterDataCache();
  return sub;
}

export async function deleteSubcategory(categoryId: string, subId: string): Promise<void> {
  await deleteDoc(doc(db, CATEGORIES, categoryId, SUBCATEGORIES, subId));
  await revalidateMasterDataCache();
}
