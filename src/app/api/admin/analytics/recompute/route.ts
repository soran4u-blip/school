import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { writeAnalyticsSnapshot } from '@/core/server/analytics';
import { logServerError } from '@/core/server/errorLog';
import { recordAuditEvent } from '@/core/server/auditLog';
import { errorMessage, errorStack } from '@/lib/errors';

// POST /api/admin/analytics/recompute — recompute the analytics snapshot on demand.
//
// The same work the scheduled `analytics` task does, exposed to a logged-in superadmin so they
// can refresh the page without waiting for the next scheduled run. The scheduler reaches it
// through /api/cron/analytics instead, which authenticates on a shared secret because a cron
// service has no session.
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'analytics:read');
  if (auth.error) return auth.error;

  try {
    const snapshot = await writeAnalyticsSnapshot(auth.context.db);
    await recordAuditEvent(auth.context.db, {
      actor: auth.context.user,
      action: 'analytics.recompute',
      targetType: 'system',
      targetId: 'analytics',
      summary: 'Recomputed the analytics snapshot',
      metadata: { computeMs: snapshot.computeMs },
      request,
    });
    return NextResponse.json({ success: true, snapshot });
  } catch (error) {
    console.error('Analytics recompute failed:', error);
    await logServerError('Analytics recompute failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json(
      { success: false, error: errorMessage(error, 'Could not recompute analytics') },
      { status: 500 }
    );
  }
}
