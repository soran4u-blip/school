import type { Firestore } from 'firebase-admin/firestore';
import { JobApplication } from '@/core/types/job';

// Repair path for `Job.applicantCount`, the other denormalized counter in the system. It's
// incremented atomically by /api/job-applications, so it should never drift — but "should never
// drift" is exactly the assumption that makes a counter unrecoverable when it does. Any
// denormalized field needs a way to be rebuilt from its source; this is that way for applicants,
// as repairRatings() is for review aggregates.

export async function repairApplicantCounts(db: Firestore): Promise<{ repaired: string[]; checked: number }> {
  const repaired: string[] = [];
  let checked = 0;

  // One pass over applications, then one over jobs — O(applications + jobs) rather than a
  // per-job count query.
  const applications = await db.collection('jobApplications').get();
  const totals = new Map<string, number>();
  applications.docs.forEach((d) => {
    const { jobId } = d.data() as JobApplication;
    if (!jobId) return;
    totals.set(jobId, (totals.get(jobId) || 0) + 1);
  });

  const jobs = await db.collection('jobs').get();
  for (const job of jobs.docs) {
    checked += 1;
    const actual = totals.get(job.id) || 0;
    const stored = (job.data().applicantCount as number | undefined) ?? 0;
    if (stored === actual) continue;
    await job.ref.update({ applicantCount: actual });
    repaired.push(`jobs/${job.id}`);
  }

  return { repaired, checked };
}
