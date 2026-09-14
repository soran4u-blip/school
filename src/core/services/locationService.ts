import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Governorate, City } from '../types/masterData';
import { revalidateMasterDataCache } from './cacheRevalidation';

// Governorates and their city subcollections. Master data: tiny (≈18 governorates, a few dozen
// cities per governorate), public-read, superadmin-write.
//
// These read the whole collection and filter/sort in memory on purpose. A `where('isActive')`
// + `orderBy('displayOrder')` pair needs a composite index per combination, and getting one
// wrong fails at runtime rather than at deploy time — not a trade worth making to skip a filter
// over eighteen documents. The large, genuinely query-shaped collections (institutions, tutors,
// jobs) do use indexed queries; see institutionService/tutorService.

const GOVERNORATES = 'locations_governorates';
const CITIES = 'cities';

function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T): number {
  return a.displayOrder - b.displayOrder;
}

export async function getGovernorates(activeOnly = true): Promise<Governorate[]> {
  const snap = await getDocs(collection(db, GOVERNORATES));
  const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Governorate);
  return (activeOnly ? list.filter((g) => g.isActive) : list).sort(byDisplayOrder);
}

export async function getGovernorateById(id: string): Promise<Governorate | null> {
  const list = await getGovernorates(false);
  return list.find((g) => g.id === id) || null;
}

export async function saveGovernorate(gov: Governorate): Promise<Governorate> {
  await setDoc(doc(db, GOVERNORATES, gov.id), gov, { merge: true });
  await revalidateMasterDataCache();
  return gov;
}

export async function deleteGovernorate(id: string): Promise<void> {
  // Firestore doesn't cascade-delete subcollections when their parent document goes, so the
  // cities would otherwise linger as orphans that still satisfy a collection-group read.
  const cities = await getDocs(collection(db, GOVERNORATES, id, CITIES));
  await Promise.all(cities.docs.map((c) => deleteDoc(c.ref)));
  await deleteDoc(doc(db, GOVERNORATES, id));
  await revalidateMasterDataCache();
}

export async function getCities(governorateId: string, activeOnly = true): Promise<City[]> {
  const snap = await getDocs(collection(db, GOVERNORATES, governorateId, CITIES));
  const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as City);
  return (activeOnly ? list.filter((c) => c.isActive) : list).sort(byDisplayOrder);
}

export async function saveCity(city: City): Promise<City> {
  await setDoc(doc(db, GOVERNORATES, city.governorateId, CITIES, city.id), city, { merge: true });
  await revalidateMasterDataCache();
  return city;
}

export async function deleteCity(governorateId: string, cityId: string): Promise<void> {
  await deleteDoc(doc(db, GOVERNORATES, governorateId, CITIES, cityId));
  await revalidateMasterDataCache();
}
