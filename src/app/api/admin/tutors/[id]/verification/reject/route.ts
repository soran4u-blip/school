import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { tutorVerificationRejectSchema } from '@/core/validation/schemas';
import { recordAuditEvent } from '@/core/server/auditLog';
import { dispatchNotification, resolveOwnerRecipient } from '@/core/server/notifications';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';
import { Tutor } from '@/core/types/tutor';

// POST /api/admin/tutors/[id]/verification/reject
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const parsed = await parseJsonBody(request, tutorVerificationRejectSchema);
  if (parsed.error) return parsed.error;
  const { rejectionReason } = parsed.data;

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
    await verificationRef.update({
      status: 'REJECTED',
      reviewedAt: now,
      ...(rejectionReason ? { rejectionReason } : {}),
    });
    await tutorRef.update({ verificationRequestStatus: 'REJECTED', updatedAt: now });

    await recordAuditEvent(db, {
      actor: user,
      action: 'tutor.verification.reject',
      targetType: 'tutor',
      targetId: id,
      summary: `Rejected verification request from "${tutor.fullName?.en || tutor.fullName?.ar}"`,
      metadata: { reason: rejectionReason || null },
      request,
    });

    const owner = await resolveOwnerRecipient(db, 'tutors', id).catch(() => null);
    if (owner) {
      await dispatchNotification(db, {
        ...owner,
        recipientRole: 'tutor',
        type: 'VERIFICATION',
        title: { ar: 'لم تتم الموافقة على طلب التوثيق', en: 'Your verification request was not approved' },
        body: {
          ar: rejectionReason || 'يرجى مراجعة وثائقك وإعادة رفعها.',
          en: rejectionReason || 'Please review your documents and resubmit.',
        },
        linkUrl: '/tutor/dashboard?tab=profile',
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verification rejection failed:', error);
    await logServerError('Verification rejection failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not reject the verification request') }, { status: 500 });
  }
}
