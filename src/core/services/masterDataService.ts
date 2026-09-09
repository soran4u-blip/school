// Barrel for the master-data domain services. This file used to hold every governorate, city,
// category, taxonomy and settings read/write itself — backed by an in-memory copy of
// seedData.json that most of the write paths never persisted anywhere. Each concern now lives in
// its own service and talks to Firestore for real; this re-export exists so the ~30 call sites
// that import from '@/core/services/masterDataService' keep working.
//
// Prefer importing from the specific service in new code.

export {
  getGovernorates,
  getGovernorateById,
  saveGovernorate,
  deleteGovernorate,
  getCities,
  saveCity,
  deleteCity,
} from './locationService';

export {
  getCategories,
  getCategoryById,
  saveCategory,
  deleteCategory,
  getSubcategories,
  saveSubcategory,
  deleteSubcategory,
} from './categoryService';

export {
  getTaxonomies,
  saveTaxonomy,
  deleteTaxonomy,
  getQuickSearchTags,
  saveQuickSearchTag,
  deleteQuickSearchTag,
} from './taxonomyService';

export { getSystemSettings, updateSystemSettings, DEFAULT_SYSTEM_SETTINGS } from './settingsService';
