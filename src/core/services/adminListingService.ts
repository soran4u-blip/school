import { ListingStatus } from '@/components/shared/ListingStatusControl';

// Client-side wrapper for the admin listing mutations.
//
// These go through /api/admin/listings/[type]/[id] rather than writing Firestore from the browser
// so that verifying, featuring, suspending, deleting, restoring and erasing a listing leave an audit
// trail — see core/server/auditLog.ts.

export type AdminListingType = 'institutions' | 'tutors' | 'employers';

async function send(type: AdminListingType, id: string, init: RequestInit): Promise<void> {
  const res = await fetch(`/api/admin/listings/${type}/${id}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'The action could not be completed');
  }
}

export async function updateListing(
  type: AdminListingType,
  id: string,
  patch: { status?: ListingStatus; isVerified?: boolean; isFeatured?: boolean }
): Promise<void> {
  await send(type, id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

// A soft delete: the listing leaves the directory but can be restored until the purge task erases
// it. See core/types/softDelete.ts.
export async function deleteListing(type: AdminListingType, id: string): Promise<void> {
  await send(type, id, { method: 'DELETE' });
}

export async function restoreListing(type: AdminListingType, id: string): Promise<void> {
  await send(type, `${id}/restore`, { method: 'POST' });
}

// Irreversible, superadmin-only, and only accepted for a listing that's already deleted.
export async function eraseListing(type: AdminListingType, id: string): Promise<void> {
  await send(type, `${id}?erase=1`, { method: 'DELETE' });
}
