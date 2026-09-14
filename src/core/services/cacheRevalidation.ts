// Called after a direct client-SDK write to master data (governorates, cities, categories,
// subcategories, taxonomies, quick-search tags) so the public read side — cached for up to
// REVALIDATE_SECONDS via unstable_cache in core/server/data/masterData.ts — doesn't keep serving
// the old value. Best-effort: the Firestore write already succeeded by the time this is called, so
// a failure here should cost a few minutes of staleness, not the save itself.
export async function revalidateMasterDataCache(): Promise<void> {
  await fetch('/api/admin/revalidate', { method: 'POST' }).catch(() => {});
}
