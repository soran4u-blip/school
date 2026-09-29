import type { Firestore, Query } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ListingType } from '@/core/server/listingDeletion';

// Jobs and events posted by a listing that an admin has deleted.
//
// Public job/event pages only show status == 'ACTIVE', but deleting the institution or employer
// behind a posting used to leave that posting ACTIVE — a vacancy still taking applications for an
// organization that had been removed from the platform. A delete now closes those postings and
// tags each with `closedByListingDelete`, so a restore reopens exactly the ones it closed and
// leaves alone anything the owner had already closed themselves. firestore.rules freezes tagged
// postings for their owner, for the same reason the listing itself is frozen.

const POSTING_COLLECTIONS = ['jobs', 'events'] as const;

// Tutors don't post jobs or events.
const OWNER_FIELD: Partial<Record<ListingType, 'institutionId' | 'employerId'>> = {
  institutions: 'institutionId',
  employers: 'employerId',
};

// Firestore caps a batch at 500 writes.
const BATCH_LIMIT = 400;

async function updateAll(db: Firestore, query: Query, patch: Record<string, unknown>): Promise<number> {
  const snap = await query.get();
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.update(d.ref, patch));
    await batch.commit();
  }
  return snap.size;
}

export async function closeListingPostings(db: Firestore, type: ListingType, listingId: string): Promise<number> {
  const field = OWNER_FIELD[type];
  if (!field) return 0;
  const patch = { status: 'CLOSED', closedByListingDelete: true, updatedAt: new Date().toISOString() };
  let closed = 0;
  for (const name of POSTING_COLLECTIONS) {
    const query = db.collection(name).where(field, '==', listingId).where('status', '==', 'ACTIVE');
    closed += await updateAll(db, query, patch);
  }
  return closed;
}

export async function reopenListingPostings(db: Firestore, type: ListingType, listingId: string): Promise<number> {
  const field = OWNER_FIELD[type];
  if (!field) return 0;
  const patch = { status: 'ACTIVE', closedByListingDelete: FieldValue.delete(), updatedAt: new Date().toISOString() };
  let reopened = 0;
  for (const name of POSTING_COLLECTIONS) {
    const query = db.collection(name).where(field, '==', listingId).where('closedByListingDelete', '==', true);
    reopened += await updateAll(db, query, patch);
  }
  return reopened;
}
