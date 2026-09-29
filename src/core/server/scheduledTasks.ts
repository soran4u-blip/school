import crypto from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { repairRatings } from '@/core/server/ratings';
import { repairApplicantCounts } from '@/core/server/counters';
import { writeAnalyticsSnapshot } from '@/core/server/analytics';
import { runSavedSearchAlerts } from '@/core/server/savedSearchAlerts';
import { dispatchNotification } from '@/core/server/notifications';
import { purgeExpiredListings } from '@/core/server/listingDeletion';

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

  'purge-deleted-listings': {
    description: 'Permanently erase listings that were deleted more than the retention period ago.',
    run: (db) => purgeExpiredListings(db),
  },

  'saved-search-alerts': {
    description: 'Notify students when a new listing matches one of their saved searches.',
    run: (db) => runSavedSearchAlerts(db),
  },

  'inquiry-reminders': {
    description: 'Notify inquiry owners about due follow-ups once per scheduled date.',
    run: async (db) => {
      const now = new Date();
      const nowIso = now.toISOString();
      const snap = await db.collection('inquiries').get();
      let sent = 0;

      for (const doc of snap.docs) {
        const inquiry = doc.data() as {
          status?: string;
          nextFollowUpAt?: string;
          reminderSentAt?: string;
          assignedTo?: string;
          institutionId?: string;
          fullName?: string;
        };
        if (!inquiry.nextFollowUpAt || inquiry.status === 'CLOSED') continue;
        if (new Date(inquiry.nextFollowUpAt).getTime() > now.getTime()) continue;
        if (inquiry.reminderSentAt && inquiry.reminderSentAt >= inquiry.nextFollowUpAt) continue;

        let recipientId = inquiry.assignedTo;
        let recipientRole: 'admin' | 'institution' = 'admin';
        let pushOwnerId: string | undefined;
        if (!recipientId && inquiry.institutionId) {
          const institution = await db.collection('institutions').doc(inquiry.institutionId).get();
          recipientId = institution.data()?.userId as string | undefined;
          recipientRole = 'institution';
          pushOwnerId = inquiry.institutionId;
        }
        if (!recipientId) continue;

        await dispatchNotification(db, {
          recipientId,
          recipientRole,
          pushOwnerId,
          type: 'INQUIRY',
          title: { ar: 'تذكير بمتابعة استفسار', en: 'Inquiry follow-up reminder' },
          body: { ar: `حان وقت متابعة استفسار ${inquiry.fullName || 'جديد'}.`, en: `Follow up on the inquiry from ${inquiry.fullName || 'a prospective student'}.` },
          linkUrl: recipientRole === 'institution' ? '/institution/dashboard' : '/admin/reviews',
          metadata: { inquiryId: doc.id, nextFollowUpAt: inquiry.nextFollowUpAt },
        });
        await doc.ref.update({ reminderSentAt: nowIso, updatedAt: nowIso });
        sent += 1;
      }
      return { checked: snap.size, sent };
    },
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
