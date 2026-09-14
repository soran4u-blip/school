import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { recordAuditEvent } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { dispatchNotification, resolveOwnerRecipient } from '@/core/server/notifications';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';
import { deriveVerificationBadge } from '@/lib/utils';
import { LocalizedString } from '@/core/types/masterData';
import { Tutor } from '@/core/types/tutor';

// POST /api/admin/tutors/[id]/verification/approve
//
// Approving a verification request both closes out the private request doc and flips the same
// isVerified/verificationBadgeLabel fields the manual toggle on /admin/tutors already writes via
// /api/admin/listings/[type]/[id] — kept in this route rather than calling that one internally so
// the audit entry and tutor notification stay specific to "a submitted request was approved"
// rather than a generic listing edit.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const { id } = await params;
  try {
    const tutorRef = db.collection('tutors').doc(id);
    const tutorSnap = await tutorRef.get();
    if (!tutorSnap.exists) return NextResponse.json({ success: false, error: 'Tutor not found' }, { status: 404 });
    const tutor = tutorSnap.data() as Tutor;

    const verificationRef = tutorRef.collection('private').doc('verification');
    const verificationSnap = await verificationRef.get();
    if (!verificationSnap.exists || verificationSnap.data()?.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'This tutor has no pending verification request' }, { status: 400 });
    }

    const now = new Date().toISOString();
    await verificationRef.update({ status: 'APPROVED', reviewedAt: now });
    await tutorRef.update({
      isVerified: true,
      verificationBadgeLabel: deriveVerificationBadge(true, tutor.verificationBadgeLabel || ({ ar: '', en: '' } as LocalizedString)),
      verificationRequestStatus: 'APPROVED',
      updatedAt: now,
    });

    await recordAuditEvent(db, {
      actor: user,
      action: 'tutor.verification.approve',
      targetType: 'tutor',
      targetId: id,
      summary: `Approved verification request from "${tutor.fullName?.en || tutor.fullName?.ar}"`,
      request,
    });

    const owner = await resolveOwnerRecipient(db, 'tutors', id).catch(() => null);
    if (owner) {
      await dispatchNotification(db, {
        ...owner,
        recipientRole: 'tutor',
        type: 'VERIFICATION',
        title: { ar: 'تم توثيق ملفك', en: 'Your profile is now verified' },
        body: {
          ar: 'راجعت الإدارة وثائقك ووافقت على توثيق ملفك. سيظهر الآن شارة "موثّق" للطلاب.',
          en: 'Your submitted documents were reviewed and approved. Your profile now shows a verified badge to students.',
        },
        linkUrl: '/tutor/dashboard?tab=profile',
      }).catch(() => {});
    }

    revalidatePublicData('tutors');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification approval failed:', error);
    await logServerError('Verification approval failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not approve the verification request') }, { status: 500 });
  }
}
