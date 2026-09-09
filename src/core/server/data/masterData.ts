import { unstable_cache } from 'next/cache';
import {
  Governorate,
  City,
  Category,
  TaxonomyItem,
  QuickSearchTag,
  SystemSettings,
} from '@/core/types/masterData';
import { DEFAULT_SYSTEM_SETTINGS } from '@/core/services/settingsService';
import { CACHE_TAGS, REVALIDATE_SECONDS, requireAdminDb, withId } from './cache';

// Server-side reads of the master data every page needs (governorate and category names, subject
// taxonomies, site settings). These change rarely and are read constantly, so they're the clearest
// win from caching on the server: previously every visitor fetched the whole set from the browser
// on every page load.

function byDisplayOrder<T extends { displayOrder: number }>(a: T, b: T): number {
  return a.displayOrder - b.displayOrder;
}

export const getPublicGovernorates = unstable_cache(
  async (): Promise<Governorate[]> => {
    const snap = await requireAdminDb().collection('locations_governorates').get();
    return snap.docs
      .map((d) => withId<Governorate>(d.id, d.data()))
      .filter((g) => g.isActive)
      .sort(byDisplayOrder);
  },
  ['public-governorates'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);

export const getPublicCities = unstable_cache(
  async (governorateId: string): Promise<City[]> => {
    const snap = await requireAdminDb()
      .collection('locations_governorates')
      .doc(governorateId)
      .collection('cities')
      .get();
    return snap.docs
      .map((d) => withId<City>(d.id, d.data()))
      .filter((c) => c.isActive)
      .sort(byDisplayOrder);
  },
  ['public-cities'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);

export const getPublicCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const snap = await requireAdminDb().collection('categories').get();
    return snap.docs
      .map((d) => withId<Category>(d.id, d.data()))
      .filter((c) => c.isActive)
      .sort(byDisplayOrder);
  },
  ['public-categories'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);

// The whole taxonomy set in one cached read. Callers narrow by `type` in memory rather than
// issuing a query per type, which would otherwise mean several round-trips per page render.
export const getPublicTaxonomies = unstable_cache(
  async (): Promise<TaxonomyItem[]> => {
    const snap = await requireAdminDb().collection('taxonomies_master').get();
    return snap.docs
      .map((d) => withId<TaxonomyItem>(d.id, d.data()))
      .filter((t) => t.isActive)
      .sort(byDisplayOrder);
  },
  ['public-taxonomies'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);

export const getPublicQuickSearchTags = unstable_cache(
  async (): Promise<QuickSearchTag[]> => {
    const snap = await requireAdminDb().collection('quick_search_tags').get();
    return snap.docs
      .map((d) => withId<QuickSearchTag>(d.id, d.data()))
      .filter((t) => t.isActive)
      .sort(byDisplayOrder);
  },
  ['public-quick-search-tags'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);

export const getPublicSystemSettings = unstable_cache(
  async (): Promise<SystemSettings> => {
    const snap = await requireAdminDb().collection('system_settings').doc('global').get();
    if (!snap.exists) return DEFAULT_SYSTEM_SETTINGS;
    return { ...DEFAULT_SYSTEM_SETTINGS, ...(snap.data() as Partial<SystemSettings>) };
  },
  ['public-system-settings'],
  { tags: [CACHE_TAGS.masterData], revalidate: REVALIDATE_SECONDS }
);
