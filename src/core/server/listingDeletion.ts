import type { DocumentData, DocumentReference, Firestore } from 'firebase-admin/firestore';
import { AuditTargetType } from '@/core/types/auditLog';
import { LocalizedString } from '@/core/types/masterData';
import { recordAuditEvent, SYSTEM_ACTOR } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { DELETED_STATUS, isPurgeDue } from '@/lib/listingLifecycle';

// The three admin-managed directory listing types, and the Firestore side of deleting them.
// Shared by /api/admin/listings/[type]/[id] (soft delete + erase), its /restore sibling, and the
// 'purge-deleted-listings' scheduled task. See core/types/softDelete.ts for the lifecycle.

// `verifiable`/`featurable` say which listing types actually carry that field on their document —
// see Institution (isVerified + isFeatured) and Tutor (isVerified only) in core/types. Employers
// have neither; nothing renders either field for them, so writing them would just be dead data
// with a misleading audit-log entry. `statuses` is what a restore may return a listing to.
export const LISTING_COLLECTIONS = {
  institutions: {
    collection: 'institutions',
    target: 'institution' as AuditTargetType,
    tag: 'institutions' as const,
    verifiable: true,
    featurable: true,
    statuses: ['DRAFT', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const,
  },
  tutors: {
    collection: 'tutors',
    target: 'tutor' as AuditTargetType,
    tag: 'tutors' as const,
    verifiable: true,
    featurable: false,
    statuses: ['ACTIVE', 'PENDING', 'SUSPENDED'] as const,
  },
  employers: {
    collection: 'employers',
    target: 'employer' as AuditTargetType,
    tag: 'jobs' as const,
    verifiable: false,
    featurable: false,
    statuses: ['ACTIVE', 'PENDING', 'SUSPENDED'] as const,
  },
};

export type ListingType = keyof typeof LISTING_COLLECTIONS;
export type ListingConfig = (typeof LISTING_COLLECTIONS)[ListingType];

export function resolveListing(type: string): ListingConfig | null {
  return Object.prototype.hasOwnProperty.call(LISTING_COLLECTIONS, type) ? LISTING_COLLECTIONS[type as ListingType] : null;
}

export function listingName(data: DocumentData): string {
  const name = data.name as LocalizedString | string | undefined;
  if (typeof name === 'string') return name;
  if (name?.en || name?.ar) return name.en || name.ar;
  const fullName = data.fullName as LocalizedString | undefined;
  return fullName?.en || fullName?.ar || 'unknown';
}

// Irreversibly removes a listing document. Firestore doesn't cascade-delete subcollections, and
// `private` holds identity/accreditation documents — the worst kind of leftover — so those go
// first. Other subcollections (programs, pushSubscriptions) are cleared too, for the same reason.
export async function eraseListingDocument(ref: DocumentReference): Promise<void> {
  const subcollections = await ref.listCollections();
  for (const sub of subcollections) {
    const docs = await sub.listDocuments();
    await Promise.all(docs.map((d) => d.delete()));
  }
  await ref.delete();
}

/**
 * Erases every listing whose soft-delete retention window has passed. Idempotent: a second run
 * finds nothing left to purge, and a listing restored between the query and the erase is re-read
 * and skipped rather than erased.
 */
export async function purgeExpiredListings(db: Firestore, now = new Date()) {
  const purged: { type: ListingType; id: string }[] = [];
  let checked = 0;

  for (const [type, config] of Object.entries(LISTING_COLLECTIONS) as [ListingType, ListingConfig][]) {
    const snap = await db.collection(config.collection).where('status', '==', DELETED_STATUS).get();
    checked += snap.size;

    for (const doc of snap.docs) {
      if (!isPurgeDue(doc.data(), now)) continue;
      const fresh = await doc.ref.get();
      if (!fresh.exists || !isPurgeDue(fresh.data()!, now)) continue;

      const name = listingName(fresh.data()!);
      await eraseListingDocument(doc.ref);
      purged.push({ type, id: doc.id });
      await recordAuditEvent(db, {
        actor: SYSTEM_ACTOR,
        action: 'listing.purge',
        targetType: config.target,
        targetId: doc.id,
        summary: `Permanently erased ${type} "${name}" after the retention period`,
        metadata: { deletedAt: String(fresh.get('deletedAt') ?? '') },
      });
    }
  }

  if (purged.length > 0) revalidatePublicData('institutions', 'tutors', 'jobs');
  return { checked, purged: purged.length };
}
