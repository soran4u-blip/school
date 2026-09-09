// The filters a saved search actually re-runs.
//
// These are stored as fields rather than left implicit in `path` so the alert job can match new
// listings against them without parsing a URL, and so the stored search can't drift from what its
// label claims — which it used to: the label was built from the live filter state while `path`
// came from `window.location.search`, and the explore page never writes its filters back to the
// URL. A search saved as "Baghdad • Universities" could therefore re-run completely unfiltered.
export interface SavedSearchFilters {
  q?: string;
  categoryId?: string;
  governorateId?: string;
}

export interface SavedSearch {
  id: string;
  label: string; // e.g. "Baghdad Universities" — derived from the filters at save time
  path: string; // the /explore?... URL to re-run this search
  filters?: SavedSearchFilters; // absent on searches saved before this field existed
  createdAt: string;
  // Watermark for the alert job: matches newer than this haven't been announced yet. Absent
  // means "never notified", and the job falls back to createdAt so saving a search doesn't
  // immediately notify about the entire existing directory.
  lastNotifiedAt?: string;
}
