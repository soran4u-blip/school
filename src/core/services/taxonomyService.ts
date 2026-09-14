import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { TaxonomyItem, TaxonomyType, QuickSearchTag } from '../types/masterData';
import { revalidateMasterDataCache } from './cacheRevalidation';

// Cross-cutting taxonomy items (accreditations, curricula, subjects, degree/student levels,
// facilities) plus the homepage quick-search tags. Same in-memory-filter reasoning as
// locationService: one small collection, filtered by `type`/`isActive` in JS so no combination
// of filters needs its own composite index.

const TAXONOMIES = 'taxonomies_master';
const QUICK_SEARCH_TAGS = 'quick_search_tags';

function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T): number {
  return a.displayOrder - b.displayOrder;
}

export async function getTaxonomies(type?: TaxonomyType | string, activeOnly = true): Promise<TaxonomyItem[]> {
  const snap = await getDocs(collection(db, TAXONOMIES));
  let list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as TaxonomyItem);
  if (type) list = list.filter((t) => t.type === type);
  if (activeOnly) list = list.filter((t) => t.isActive);
  return list.sort(byDisplayOrder);
}

export async function saveTaxonomy(item: TaxonomyItem): Promise<TaxonomyItem> {
  await setDoc(doc(db, TAXONOMIES, item.id), item, { merge: true });
  await revalidateMasterDataCache();
  return item;
}

export async function deleteTaxonomy(id: string): Promise<void> {
  await deleteDoc(doc(db, TAXONOMIES, id));
  await revalidateMasterDataCache();
}

export async function getQuickSearchTags(activeOnly = true): Promise<QuickSearchTag[]> {
  const snap = await getDocs(collection(db, QUICK_SEARCH_TAGS));
  const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as QuickSearchTag);
  return (activeOnly ? list.filter((t) => t.isActive) : list).sort(byDisplayOrder);
}

export async function saveQuickSearchTag(tag: QuickSearchTag): Promise<QuickSearchTag> {
  await setDoc(doc(db, QUICK_SEARCH_TAGS, tag.id), tag, { merge: true });
  await revalidateMasterDataCache();
  return tag;
}

export async function deleteQuickSearchTag(id: string): Promise<void> {
  await deleteDoc(doc(db, QUICK_SEARCH_TAGS, id));
  await revalidateMasterDataCache();
}
