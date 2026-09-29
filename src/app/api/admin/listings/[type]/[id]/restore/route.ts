import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requirePermission } from '@/core/server/session';
import { recordAuditEvent } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { logServerError } from '@/core/server/errorLog';
import { resolveListing, listingName, ListingType } from '@/core/server/listingDeletion';
import { reopenListingPostings } from '@/core/server/listingPostings';
import { errorMessage, errorStack } from '@/lib/errors';
import { isDeleted, restoredStatus } from '@/lib/listingLifecycle';
import { canPublishInstitution } from '@/lib/publishingGuardrails';
import { Institution } from '@/core/types/institution';

// POST /api/admin/listings/[type]/[id]/restore — undoes a soft delete. See
// core/types/softDelete.ts for the lifecycle.
//
// The listing goes back to the status it had before the delete. The one exception is an
// institution that would return straight to ACTIVE but no longer passes the publishing gate
// (the gate may have tightened since it was deleted): that one comes back PENDING instead, the
// same outcome as any other listing awaiting approval.
export async function POST(request: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { type, id } = await params;
  const target = resolveListing(type);
  if (!target) return NextResponse.json({ success: false, error: 'Unknown listing type' }, { status: 404 });

  try {
    const ref = db.collection(target.collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Listing not found — it may already have been erased' }, { status: 404 });
    const before = snap.data()!;
    if (!isDeleted(before)) return NextResponse.json({ success: false, error: 'Listing is not deleted' }, { status: 409 });

    let status = restoredStatus(before, target.statuses);
    if (type === 'institutions' && status === 'ACTIVE') {
      const candidate = { ...before, id, status } as Institution;
      if (!canPublishInstitution(candidate).publishable) status = 'PENDING';
    }

    await ref.update({
      status,
      updatedAt: new Date().toISOString(),
      deletedAt: FieldValue.delete(),
      deletedBy: FieldValue.delete(),
      statusBeforeDelete: FieldValue.delete(),
    });

    // Only an ACTIVE listing gets its postings back — reopening a job for an organization that
    // comes back PENDING (hidden) would put the vacancy online before the organization itself.
    // Those reopen when an admin approves the listing, in the PATCH handler next door.
    const reopenedPostings = status === 'ACTIVE' ? await reopenListingPostings(db, type as ListingType, id) : 0;
    if (reopenedPostings > 0) revalidatePublicData('jobs', 'events');

    await recordAuditEvent(db, {
      actor: user,
      action: 'listing.restore',
      targetType: target.target,
      targetId: id,
      summary: `Restored ${type} "${listingName(before)}" as ${status}`,
      metadata: { to: status, deletedAt: String(before.deletedAt ?? ''), reopenedPostings },
      request,
    });

    revalidatePublicData(target.tag);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Listing restore failed:', error);
    await logServerError('Listing restore failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not restore the listing') }, { status: 500 });
  }
}
