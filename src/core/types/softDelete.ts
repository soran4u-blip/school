// Fields an admin "delete" leaves on a directory listing (institution, tutor, employer).
//
// Deleting a listing used to erase the document outright, which had two costs: a mistaken delete
// was unrecoverable, and the owner's account kept a claim pointing at a document that no longer
// existed, so their dashboard failed with a generic "try refreshing" error. A delete now sets
// status to 'DELETED' and records these instead; the document is erased for real only once the
// retention window in src/lib/listingLifecycle.ts has passed.
//
// Every public read already filters on status == 'ACTIVE', so a DELETED listing disappears from
// the directory the moment it's marked, with no change to those queries.
export interface SoftDeleteFields {
  deletedAt?: string;
  deletedBy?: string;
  // What `status` was before the delete, so a restore can put it back exactly.
  statusBeforeDelete?: string;
}
