import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { CMSBanner } from '../types/masterData';
import { revalidateMasterDataCache } from './cacheRevalidation';

// Homepage ad-banner campaigns. Same shape as locationService/categoryService/taxonomyService:
// a direct client-SDK write (gated by firestore.rules' canEditDirectory()), followed by busting
// the cached public read (core/server/data/masterData.ts's getPublicActiveBanners) so a saved
// change reaches the homepage immediately instead of waiting out REVALIDATE_SECONDS.

const COLLECTION = 'cms_banners';

export async function getBanners(): Promise<CMSBanner[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as CMSBanner);
}

export async function saveBanner(banner: CMSBanner): Promise<CMSBanner> {
  await setDoc(doc(db, COLLECTION, banner.id), banner, { merge: true });
  await revalidateMasterDataCache();
  return banner;
}

export async function deleteBanner(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
  await revalidateMasterDataCache();
}
