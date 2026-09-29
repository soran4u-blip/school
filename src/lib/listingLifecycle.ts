// Pure rules for soft-deleting, restoring and eventually purging a directory listing. Kept free
// of Firestore so they can be unit-tested; the I/O lives in src/core/server/listingDeletion.ts.
// See core/types/softDelete.ts for why a delete is soft in the first place.

export const DELETED_STATUS = 'DELETED' as const;

// How long a deleted listing stays restorable before the purge task erases it.
export const DELETED_LISTING_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

type WithStatus = { status?: string };

export function isDeleted(listing: WithStatus): boolean {
  return listing.status === DELETED_STATUS;
}

// Type guard for admin lists: drops DELETED rows and narrows `status` so the rest can be handed to
// controls that only understand live statuses.
export function isNotDeleted<T extends WithStatus>(listing: T): listing is T & { status: Exclude<T['status'], 'DELETED'> } {
  return !isDeleted(listing);
}

export function softDeletePatch(before: WithStatus, actorUid: string, now: Date) {
  const iso = now.toISOString();
  return {
    status: DELETED_STATUS,
    statusBeforeDelete: before.status || 'PENDING',
    deletedAt: iso,
    deletedBy: actorUid,
    updatedAt: iso,
  };
}

// The status a restore returns to. Anything unknown (a document from before these fields existed,
// or a hand-edited one) comes back as PENDING — hidden until an admin approves it again — rather
// than straight into the public directory.
export function restoredStatus(before: { statusBeforeDelete?: string }, allowed: readonly string[]): string {
  const previous = before.statusBeforeDelete;
  return previous && previous !== DELETED_STATUS && allowed.includes(previous) ? previous : 'PENDING';
}

export function purgeDate(deletedAt: string, retentionDays = DELETED_LISTING_RETENTION_DAYS): Date {
  return new Date(new Date(deletedAt).getTime() + retentionDays * DAY_MS);
}

// A listing marked DELETED with no (or an unparseable) deletedAt is never auto-purged: erasing
// something we can't date is exactly the kind of irreversible mistake this exists to prevent.
export function isPurgeDue(listing: WithStatus & { deletedAt?: string }, now: Date, retentionDays = DELETED_LISTING_RETENTION_DAYS): boolean {
  if (!isDeleted(listing) || !listing.deletedAt) return false;
  const due = purgeDate(listing.deletedAt, retentionDays).getTime();
  return !Number.isNaN(due) && due <= now.getTime();
}
