import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { listingAdminUpdateSchema } from '@/core/validation/schemas';
import { recordAuditEvent } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';
import { deriveVerificationBadge } from '@/lib/utils';
import { LocalizedString } from '@/core/types/masterData';
import { Institution } from '@/core/types/institution';
import { canPublishInstitution } from '@/lib/publishingGuardrails';
import { isDeleted, softDeletePatch, DELETED_LISTING_RETENTION_DAYS } from '@/lib/listingLifecycle';
import { resolveListing, listingName, eraseListingDocument } from '@/core/server/listingDeletion';

// Admin mutations to a directory listing's trust and visibility fields.
//
// These used to be client-SDK writes straight from /admin/institutions and /admin/tutors. They
// are the actions most worth being able to attribute later — verifying a school, featuring one on
// the homepage, suspending or deleting a profile — and a browser write leaves no trail, so they
// come through here and record an audit event. firestore.rules still permits a superadmin to
// write these fields directly; that is deliberate, since locking them to this route would also
// block the legitimate full-profile edit form at /admin/institutions/add.

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { type, id } = await params;
  const target = resolveListing(type);
  if (!target) return NextResponse.json({ success: false, error: 'Unknown listing type' }, { status: 404 });

  const parsed = await parseJsonBody(request, listingAdminUpdateSchema);
  if (parsed.error) return parsed.error;
  const { status, isVerified, isFeatured } = parsed.data;

  if (isVerified !== undefined && !target.verifiable) {
    return NextResponse.json({ success: false, error: `${type} listings don't support verification` }, { status: 400 });
  }
  if (isFeatured !== undefined && !target.featurable) {
    return NextResponse.json({ success: false, error: `${type} listings don't support featuring` }, { status: 400 });
  }
  if (type !== 'institutions' && status === 'DRAFT') {
    return NextResponse.json({ success: false, error: 'Draft status is only supported for institutions' }, { status: 400 });
  }

  try {
    const ref = db.collection(target.collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    const before = snap.data()!;
    const name = listingName(before);

    // Setting a status here would silently undelete the listing without its restore audit entry,
    // and verify/feature on a deleted listing is meaningless. Restore it first.
    if (isDeleted(before)) {
      return NextResponse.json({ success: false, error: 'This listing is deleted — restore it first' }, { status: 409 });
    }

    if (type === 'institutions' && (status === 'ACTIVE' || isVerified === true)) {
      const candidate = {
        ...before,
        id,
        ...(status !== undefined ? { status } : {}),
        ...(isVerified !== undefined ? { isVerified } : {}),
      } as Institution;
      const assessment = canPublishInstitution(candidate);
      if (!assessment.publishable) {
        return NextResponse.json(
          { success: false, error: 'Institution is not ready to publish', missingFields: assessment.missingFields, score: assessment.score },
          { status: 422 }
        );
      }
    }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (status !== undefined) patch.status = status;
    if (isFeatured !== undefined) patch.isFeatured = isFeatured;
    if (isVerified !== undefined) {
      patch.isVerified = isVerified;
      patch.verificationBadgeLabel = deriveVerificationBadge(
        isVerified,
        (before.verificationBadgeLabel as LocalizedString) || { ar: '', en: '' }
      );
    }
    await ref.update(patch);

    if (status !== undefined) {
      await recordAuditEvent(db, {
        actor: user,
        action: 'listing.status',
        targetType: target.target,
        targetId: id,
        summary: `Set ${type} "${name}" status to ${status}`,
        metadata: { from: String(before.status ?? ''), to: status },
        request,
      });
    }
    if (isVerified !== undefined) {
      await recordAuditEvent(db, {
        actor: user,
        action: 'listing.verify',
        targetType: target.target,
        targetId: id,
        summary: `${isVerified ? 'Verified' : 'Removed verification from'} ${type} "${name}"`,
        metadata: { isVerified },
        request,
      });
    }
    if (isFeatured !== undefined) {
      await recordAuditEvent(db, {
        actor: user,
        action: 'listing.feature',
        targetType: target.target,
        targetId: id,
        summary: `${isFeatured ? 'Featured' : 'Unfeatured'} ${type} "${name}"`,
        metadata: { isFeatured },
        request,
      });
    }

    revalidatePublicData(target.tag);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing update failed:', error);
    await logServerError('Listing update failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not update the listing') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { type, id } = await params;
  const target = resolveListing(type);
  if (!target) return NextResponse.json({ success: false, error: 'Unknown listing type' }, { status: 404 });

  // DELETE soft-deletes: the listing leaves the directory at once but stays restorable for
  // DELETED_LISTING_RETENTION_DAYS, after which the 'purge-deleted-listings' task erases it.
  // `?erase=1` erases immediately instead — for a listing that legally or for privacy reasons can't
  // wait out the window. It's superadmin-only (an editor can delete, never destroy) and only
  // accepted on an already-deleted listing, so erasing always takes two deliberate steps.
  const erase = request.nextUrl.searchParams.get('erase') === '1';
  if (erase && user.role !== 'superadmin') {
    return NextResponse.json({ success: false, error: 'Only a superadmin can permanently erase a listing' }, { status: 403 });
  }

  try {
    const ref = db.collection(target.collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    const before = snap.data()!;
    const name = listingName(before);

    if (erase) {
      if (!isDeleted(before)) {
        return NextResponse.json({ success: false, error: 'Delete the listing before erasing it' }, { status: 409 });
      }
      await eraseListingDocument(ref);
      await recordAuditEvent(db, {
        actor: user,
        action: 'listing.purge',
        targetType: target.target,
        targetId: id,
        summary: `Permanently erased ${type} "${name}"`,
        request,
      });
    } else {
      if (isDeleted(before)) {
        return NextResponse.json({ success: false, error: 'Listing is already deleted' }, { status: 409 });
      }
      await ref.update(softDeletePatch(before, user.uid, new Date()));
      await recordAuditEvent(db, {
        actor: user,
        action: 'listing.delete',
        targetType: target.target,
        targetId: id,
        summary: `Deleted ${type} "${name}" (restorable for ${DELETED_LISTING_RETENTION_DAYS} days)`,
        metadata: { from: String(before.status ?? '') },
        request,
      });
    }

    revalidatePublicData(target.tag);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing delete failed:', error);
    await logServerError('Listing delete failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not delete the listing') }, { status: 500 });
  }
}
