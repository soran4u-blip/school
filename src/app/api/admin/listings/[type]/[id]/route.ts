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
import { AuditTargetType } from '@/core/types/auditLog';

// Admin mutations to a directory listing's trust and visibility fields.
//
// These used to be client-SDK writes straight from /admin/institutions and /admin/tutors. They
// are the actions most worth being able to attribute later — verifying a school, featuring one on
// the homepage, suspending or deleting a profile — and a browser write leaves no trail, so they
// come through here and record an audit event. firestore.rules still permits a superadmin to
// write these fields directly; that is deliberate, since locking them to this route would also
// block the legitimate full-profile edit form at /admin/institutions/add.

const COLLECTIONS = {
  institutions: { collection: 'institutions', target: 'institution' as AuditTargetType, tag: 'institutions' as const },
  tutors: { collection: 'tutors', target: 'tutor' as AuditTargetType, tag: 'tutors' as const },
  employers: { collection: 'employers', target: 'employer' as AuditTargetType, tag: 'jobs' as const },
};

type ListingType = keyof typeof COLLECTIONS;

function resolve(type: string): (typeof COLLECTIONS)[ListingType] | null {
  return Object.prototype.hasOwnProperty.call(COLLECTIONS, type) ? COLLECTIONS[type as ListingType] : null;
}

// Institutions and tutors both carry a `verificationBadgeLabel` that tracks isVerified unless an
// admin has written a custom one; employers have no badge at all.
function nameOf(data: FirebaseFirestore.DocumentData): string {
  const name = data.name as LocalizedString | string | undefined;
  if (typeof name === 'string') return name;
  if (name?.en || name?.ar) return name.en || name.ar;
  const fullName = data.fullName as LocalizedString | undefined;
  return fullName?.en || fullName?.ar || 'unknown';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { type, id } = await params;
  const target = resolve(type);
  if (!target) return NextResponse.json({ success: false, error: 'Unknown listing type' }, { status: 404 });

  const parsed = await parseJsonBody(request, listingAdminUpdateSchema);
  if (parsed.error) return parsed.error;
  const { status, isVerified, isFeatured } = parsed.data;

  try {
    const ref = db.collection(target.collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    const before = snap.data()!;
    const name = nameOf(before);

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
  const target = resolve(type);
  if (!target) return NextResponse.json({ success: false, error: 'Unknown listing type' }, { status: 404 });

  try {
    const ref = db.collection(target.collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    const name = nameOf(snap.data()!);

    // Firestore doesn't cascade-delete subcollections; the private verification documents would
    // otherwise outlive the profile they belong to, which for identity documents is the worst
    // kind of leftover.
    const privateDocs = await ref.collection('private').get();
    await Promise.all(privateDocs.docs.map((d) => d.ref.delete()));
    await ref.delete();

    await recordAuditEvent(db, {
      actor: user,
      action: 'listing.delete',
      targetType: target.target,
      targetId: id,
      summary: `Deleted ${type} "${name}"`,
      request,
    });

    revalidatePublicData(target.tag);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Listing delete failed:', error);
    await logServerError('Listing delete failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not delete the listing') }, { status: 500 });
  }
}
