import crypto from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { repairRatings } from '@/core/server/ratings';
import { repairApplicantCounts } from '@/core/server/counters';
import { writeAnalyticsSnapshot } from '@/core/server/analytics';
import { runSavedSearchAlerts } from '@/core/server/savedSearchAlerts';

// Periodic background work, and the one place that says what it is.
//
// This app had no way to run anything on a schedule, which is what blocked saved-search alerts
// and left the denormalized counters with a repair path nobody would remember to press. Rather
// than add Cloud Functions as a second runtime, each task is a plain function invoked over HTTP
// by /api/cron/[task] — Cloud Scheduler (or any cron) hits the URL, the work runs in the same
// Next.js server as everything else, with the same Admin SDK and the same code.
//
// Every task must be idempotent and safe to run concurrently with live traffic: a scheduler will
// retry on timeout, and there is nothing to stop two runs overlapping.

export interface ScheduledTask {
  description: string;
  run: (db: Firestore) => Promise<unknown>;
}

export const SCHEDULED_TASKS: Record<string, ScheduledTask> = {
  analytics: {
    description: 'Recompute the /admin/analytics snapshot.',
    run: async (db) => {
      const snapshot = await writeAnalyticsSnapshot(db);
      return { computedAt: snapshot.computedAt, computeMs: snapshot.computeMs };
    },
  },

  counters: {
    description: 'Rebuild denormalized rating aggregates and job applicant counts from source.',
    run: async (db) => {
      const ratings = await repairRatings(db);
      const applicants = await repairApplicantCounts(db);
      return {
        ratings: { checked: ratings.checked, repaired: ratings.repaired.length },
        applicantCounts: { checked: applicants.checked, repaired: applicants.repaired.length },
      };
    },
  },

  'saved-search-alerts': {
    description: 'Notify students when a new listing matches one of their saved searches.',
    run: (db) => runSavedSearchAlerts(db),
  },
};

export type ScheduledTaskName = keyof typeof SCHEDULED_TASKS;

export function isScheduledTask(name: string): name is string {
  return Object.prototype.hasOwnProperty.call(SCHEDULED_TASKS, name);
}

/**
 * Authorizes a scheduler's call.
 *
 * A cron service can't hold a Firebase session cookie, so these endpoints authenticate on a
 * shared secret instead. Compared with timingSafeEqual so the check doesn't leak the secret one
 * byte at a time, and a missing CRON_SECRET denies everything rather than defaulting open — an
 * unset environment variable must never be the thing that publishes an open endpoint.
 */
export function isAuthorizedCronCall(providedSecret: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !providedSecret) return false;

  const a = Buffer.from(providedSecret);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
