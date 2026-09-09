import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { repairRatings } from '@/core/server/ratings';
import { repairApplicantCounts } from '@/core/server/counters';
import { logServerError } from '@/core/server/errorLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { recordAuditEvent } from '@/core/server/auditLog';

// POST /api/admin/maintenance/counters — rebuild every denormalized counter from its source of
// truth (review aggregates on institutions/tutors, applicant counts on jobs) and report what was
// out of step.
//
// Denormalized fields are the right call for the read paths that depend on them, but they are
// only safe when there is a way to rebuild them. Until now there wasn't one, so a counter that
// drifted — through the un-approve path that never decremented, a partial failure, or an
// out-of-band write — stayed wrong permanently with nothing to notice.
//
// Triggered from /admin/settings today. When scheduled-job infrastructure lands this is the
// handler a nightly job should call; it is deliberately idempotent so running it twice, or
// running it while the site is live, changes nothing beyond the first pass.
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'settings:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  try {
    const ratings = await repairRatings(db);
    const applicants = await repairApplicantCounts(db);

    await recordAuditEvent(db, {
      actor: user,
      action: 'counters.repair',
      targetType: 'system',
      targetId: 'counters',
      summary: `Repaired ${ratings.repaired.length + applicants.repaired.length} counter(s)`,
      metadata: { ratingsRepaired: ratings.repaired.length, applicantCountsRepaired: applicants.repaired.length },
      request,
    });
    revalidatePublicData('institutions', 'tutors', 'jobs');

    return NextResponse.json({
      success: true,
      ratings: { checked: ratings.checked, repairedCount: ratings.repaired.length, repaired: ratings.repaired },
      applicantCounts: {
        checked: applicants.checked,
        repairedCount: applicants.repaired.length,
        repaired: applicants.repaired,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Counter repair failed:', err);
    await logServerError('Counter repair failed', { stack: err?.stack, url: request.url });
    return NextResponse.json({ success: false, error: 'Counter repair failed — safe to retry' }, { status: 500 });
  }
}
