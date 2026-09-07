import initialSeed from '../seed/seedData.json';
import {
  Governorate,
  City,
  Category,
  TaxonomyItem,
  QuickSearchTag,
  SystemSettings
} from '../types/masterData';
import { db } from '../firebase/config';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

// In-Memory Master Data Store for rapid low-latency reads and offline-safe fallback
interface MasterDataStore {
  governorates: Governorate[];
  cities: City[];
  categories: Category[];
  taxonomies: TaxonomyItem[];
  quickSearchTags: QuickSearchTag[];
  systemSettings: SystemSettings;
}

// Global in-memory singleton initialized with complete Iraq seed data
const inMemoryStore: MasterDataStore = {
  governorates: (initialSeed.governorates as unknown) as Governorate[],
  cities: (initialSeed.cities as unknown) as City[],
  categories: (initialSeed.categories as unknown) as Category[],
  taxonomies: (initialSeed.taxonomies as unknown) as TaxonomyItem[],
  quickSearchTags: (initialSeed.quickSearchTags as unknown) as QuickSearchTag[],
  systemSettings: (initialSeed.systemSettings as unknown) as SystemSettings,
};

/* =========================================================
   GOVERNORATES & CITIES (ZERO HARDCODING)
========================================================= */
export async function getGovernorates(activeOnly = true): Promise<Governorate[]> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      const ref = collection(db, 'locations_governorates');
      const q = activeOnly ? query(ref, where('isActive', '==', true), orderBy('displayOrder', 'asc')) : query(ref, orderBy('displayOrder', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Governorate));
      }
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for governorates');
  }

  const list = inMemoryStore.governorates;
  return (activeOnly ? list.filter(g => g.isActive) : list).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getGovernorateById(id: string): Promise<Governorate | null> {
  const list = await getGovernorates(false);
  return list.find(g => g.id === id) || null;
}

export async function saveGovernorate(gov: Governorate): Promise<Governorate> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      const ref = doc(db, 'locations_governorates', gov.id);
      await setDoc(ref, gov, { merge: true });
    }
  } catch (e) {
    console.warn('Error persisting governorate to Firestore:', e);
  }

  const idx = inMemoryStore.governorates.findIndex(g => g.id === gov.id);
  if (idx >= 0) {
    inMemoryStore.governorates[idx] = gov;
  } else {
    inMemoryStore.governorates.push(gov);
  }
  return gov;
}

export async function deleteGovernorate(id: string): Promise<boolean> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      await deleteDoc(doc(db, 'locations_governorates', id));
    }
  } catch (e) {
    console.warn('Error deleting governorate from Firestore:', e);
  }
  inMemoryStore.governorates = inMemoryStore.governorates.filter(g => g.id !== id);
  return true;
}

export async function getCities(governorateId?: string, activeOnly = true): Promise<City[]> {
  let list = inMemoryStore.cities;
  if (governorateId) {
    list = list.filter(c => c.governorateId === governorateId);
  }
  if (activeOnly) {
    list = list.filter(c => c.isActive);
  }
  return list.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveCity(city: City): Promise<City> {
  const idx = inMemoryStore.cities.findIndex(c => c.id === city.id);
  if (idx >= 0) {
    inMemoryStore.cities[idx] = city;
  } else {
    inMemoryStore.cities.push(city);
  }
  return city;
}

/* =========================================================
   CATEGORIES & TAXONOMIES (ZERO HARDCODING)
========================================================= */
export async function getCategories(activeOnly = true): Promise<Category[]> {
  try {
    if (process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true') {
      const ref = collection(db, 'categories');
      const q = activeOnly ? query(ref, where('isActive', '==', true), orderBy('displayOrder', 'asc')) : query(ref, orderBy('displayOrder', 'asc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      }
    }
  } catch (e) {
    console.warn('Firestore fallback to in-memory store for categories');
  }

  const list = inMemoryStore.categories;
  return (activeOnly ? list.filter(c => c.isActive) : list).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveCategory(cat: Category): Promise<Category> {
  const idx = inMemoryStore.categories.findIndex(c => c.id === cat.id);
  if (idx >= 0) {
    inMemoryStore.categories[idx] = cat;
  } else {
    inMemoryStore.categories.push(cat);
  }
  return cat;
}

export async function getTaxonomies(type?: string, activeOnly = true): Promise<TaxonomyItem[]> {
  let list = inMemoryStore.taxonomies;
  if (type) {
    list = list.filter(t => t.type === type);
  }
  if (activeOnly) {
    list = list.filter(t => t.isActive);
  }
  return list.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function saveTaxonomy(item: TaxonomyItem): Promise<TaxonomyItem> {
  const idx = inMemoryStore.taxonomies.findIndex(t => t.id === item.id);
  if (idx >= 0) {
    inMemoryStore.taxonomies[idx] = item;
  } else {
    inMemoryStore.taxonomies.push(item);
  }
  return item;
}

/* =========================================================
   SETTINGS & QUICK SEARCH TAGS
========================================================= */
export async function getQuickSearchTags(): Promise<QuickSearchTag[]> {
  return inMemoryStore.quickSearchTags.filter(t => t.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return inMemoryStore.systemSettings;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  inMemoryStore.systemSettings = { ...inMemoryStore.systemSettings, ...settings };
  return inMemoryStore.systemSettings;
}
