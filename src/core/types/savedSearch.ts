export interface SavedSearch {
  id: string;
  label: string; // e.g. "Baghdad Universities" — derived from the filters at save time
  path: string; // the full /explore?... URL to re-run this search
  createdAt: string;
}
