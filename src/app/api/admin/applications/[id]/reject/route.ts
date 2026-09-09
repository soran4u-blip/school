import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { applicationRejectSchema } from '@/core/validation/schemas';
import { recordAuditEvent } from '@/core/server/auditLog';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';
import { Application } from '@/core/types/application';

// POST /api/admin/applications/[id]/reject
//
// Rejection used to be a direct client write. Approval already came through the server (it
// provisions an account), which left the two halves of the same decision recorded differently —
// only one of them attributable. Both go through the server now.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission(request, 'applications:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const parsed = await parseJsonBody(request, applicationRejectSchema);
  if (parsed.error) return parsed.error;
  const { rejectionReason } = parsed.data;

  const { id } = await params;
  try {
    const ref = db.collection('applications').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    const application = snap.data() as Application;

    await ref.update({
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      ...(rejectionReason ? { rejectionReason } : {}),
    });

    await recordAuditEvent(db, {
      actor: user,
      action: 'application.reject',
      targetType: 'application',
      targetId: id,
      summary: `Rejected ${String(application.type).toLowerCase()} application from "${application.fullName}"`,
      metadata: { reason: rejectionReason || null },
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Application rejection failed:', error);
    await logServerError('Application rejection failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not reject the application') }, { status: 500 });
  }
}
