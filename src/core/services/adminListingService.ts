import { ListingStatus } from '@/components/shared/ListingStatusControl';

// Client-side wrapper for the admin listing mutations.
//
// These go through /api/admin/listings/[type]/[id] rather than writing Firestore from the browser
// so that verifying, featuring, suspending and deleting a listing leave an audit trail — see
// core/server/auditLog.ts.

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

export async function deleteListing(type: AdminListingType, id: string): Promise<void> {
  await send(type, id, { method: 'DELETE' });
}
