import type { Firestore } from 'firebase-admin/firestore';
import { SavedSearch, SavedSearchFilters } from '@/core/types/savedSearch';
import { Institution } from '@/core/types/institution';
import { sendPushToStudent } from '@/core/server/push';

// Notifies students when a new institution matches one of their saved searches.
//
// This is the half of the saved-searches feature that was scoped out when it shipped: students
// could store a filter combination and re-run it by hand, but nothing told them when something
// new turned up. What was missing was somewhere for periodic work to run — that's now
// core/server/scheduledTasks.ts, and this is a task on it.
//
// Shape of the job: one query for everything published since the oldest watermark across all
// saved searches, then match in memory. The alternative — a query per saved search — is one
// Firestore round-trip per student per search per run, which is the wrong slope entirely: this
// way the cost grows with how much was published, not with how many people are watching.

const MAX_NEW_LISTINGS_SCANNED = 500;

// Searches saved before `filters` existed only have a path; read the filters back out of it so
// they still work rather than silently never matching.
function filtersFor(search: SavedSearch): SavedSearchFilters {
  if (search.filters) return search.filters;
  const queryString = search.path.includes('?') ? search.path.slice(search.path.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryString);
  return {
    q: params.get('q') || undefined,
    categoryId: params.get('category') || undefined,
    governorateId: params.get('governorate') || undefined,
  };
}

// Deliberately the same comparison the explore page's filters make, so an alert never announces
// something the student wouldn't see when they follow the link.
export function institutionMatches(institution: Institution, filters: SavedSearchFilters): boolean {
  if (filters.categoryId && institution.categoryId !== filters.categoryId) return false;
  if (filters.governorateId && institution.governorateId !== filters.governorateId) return false;
  if (filters.q) {
    const keyword = filters.q.toLowerCase().trim();
    const haystack = [
      institution.name.ar,
      institution.name.en,
      institution.description.ar,
      institution.description.en,
      institution.address.ar,
    ];
    if (!haystack.some((field) => (field || '').toLowerCase().includes(keyword))) return false;
  }
  return true;
}

export interface SavedSearchAlertResult {
  searchesChecked: number;
  newListingsScanned: number;
  notificationsSent: number;
}

export async function runSavedSearchAlerts(db: Firestore): Promise<SavedSearchAlertResult> {
  // A collection-group read: saved searches live under students/{uid}/savedSearches, and
  // firestore.rules keeps them owner-scoped for clients — the Admin SDK is what makes a
  // cross-student sweep possible at all.
  const searches = await db.collectionGroup('savedSearches').get();
  if (searches.empty) return { searchesChecked: 0, newListingsScanned: 0, notificationsSent: 0 };

  const watermarks = searches.docs.map((d) => {
    const search = d.data() as SavedSearch;
    return search.lastNotifiedAt || search.createdAt;
  });
  const oldest = watermarks.reduce((min, w) => (w < min ? w : min), watermarks[0]);

  const newListings = await db
    .collection('institutions')
    .where('status', '==', 'ACTIVE')
    .where('createdAt', '>', oldest)
    .orderBy('createdAt', 'asc')
    .limit(MAX_NEW_LISTINGS_SCANNED)
    .get();

  if (newListings.empty) {
    return { searchesChecked: searches.size, newListingsScanned: 0, notificationsSent: 0 };
  }

  const listings = newListings.docs.map((d) => ({ ...d.data(), id: d.id }) as Institution);
  const now = new Date().toISOString();

  // If the scan hit the cap, there may be newer matching institutions beyond what we fetched —
  // advancing every watermark to `now` would skip them permanently, since a future run's
  // `createdAt > since` filter would already be past them. Cap the advance at the newest listing
  // we actually looked at instead; the next run picks up from there.
  const scanCutoff = listings.length === MAX_NEW_LISTINGS_SCANNED ? listings[listings.length - 1].createdAt : now;

  let notificationsSent = 0;

  for (const searchDoc of searches.docs) {
    const search = { ...(searchDoc.data() as SavedSearch), id: searchDoc.id };
    // students/{uid}/savedSearches/{id} — the student is the grandparent document.
    const studentId = searchDoc.ref.parent.parent?.id;
    if (!studentId) continue;

    const since = search.lastNotifiedAt || search.createdAt;
    // Never move a watermark backward — a search whose own `since` is already past scanCutoff
    // (possible when another, older search forced the scan to start further back) keeps its lead.
    const newWatermark = since < scanCutoff ? scanCutoff : since;
    const filters = filtersFor(search);
    const matches = listings.filter((listing) => listing.createdAt > since && institutionMatches(listing, filters));

    // Advance the watermark even with no matches: everything scanned in this pass has now been
    // considered, and not doing so would re-examine the same listings on every future run.
    if (matches.length === 0) {
      await searchDoc.ref.update({ lastNotifiedAt: newWatermark });
      continue;
    }

    const first = matches[0];
    const title = matches.length === 1 ? first.name.en || first.name.ar : `${matches.length} new matches`;
    const body =
      matches.length === 1
        ? `New in "${search.label}": ${first.name.en || first.name.ar}`
        : `${matches.length} new listings match "${search.label}"`;

    await sendPushToStudent(db, studentId, { title, body, url: search.path });
    await searchDoc.ref.update({ lastNotifiedAt: newWatermark });
    notificationsSent += 1;
  }

  return { searchesChecked: searches.size, newListingsScanned: listings.length, notificationsSent };
}
