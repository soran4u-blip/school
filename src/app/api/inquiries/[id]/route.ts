import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { hasPermission } from '@/core/permissions';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { inquiryAdminUpdateSchema } from '@/core/validation/schemas';
import { Inquiry } from '@/core/types/review';
import { recordAuditEvent } from '@/core/server/auditLog';

// Inquiry metadata is server-owned. Institutions may advance their own lead's status; moderators
// can additionally assign, annotate, tag, and schedule the next follow-up.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });

  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const isModerator = hasPermission(user.role, 'reviews:write');
  const isInstitution = user.role === 'institution' && Boolean(user.institutionId);
  if (!isModerator && !isInstitution) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const parsed = await parseJsonBody(request, inquiryAdminUpdateSchema);
  if (parsed.error) return parsed.error;
  const patch = parsed.data;
  if (isInstitution && Object.keys(patch).some((key) => key !== 'status')) {
    return NextResponse.json({ success: false, error: 'Institutions may only update inquiry status' }, { status: 403 });
  }

  const { id } = await params;
  const ref = adminDb.collection('inquiries').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
  const current = snap.data() as Inquiry;
  if (isInstitution && current.institutionId !== user.institutionId) {
    return NextResponse.json({ success: false, error: 'This inquiry does not belong to your institution' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const nextStatus = patch.status ?? current.status;
  const update: Record<string, unknown> = {
    ...patch,
    updatedAt: now,
    ...(nextStatus === 'CLOSED' ? { closedAt: current.closedAt || now } : { closedAt: null }),
  };
  await ref.update(update);

  if (isModerator) {
    await recordAuditEvent(adminDb, {
      actor: user,
      action: 'inquiry.update',
      targetType: 'institution',
      targetId: current.institutionId,
      summary: `Updated admissions inquiry ${id}`,
      metadata: { inquiryId: id, fromStatus: current.status, toStatus: nextStatus },
      request,
    });
  }

  return NextResponse.json({ success: true, inquiry: { ...current, ...update, id } });
}
