// A record of a privileged action, kept so "who verified this institution?" and "who deleted
// that tutor?" have answers.
//
// Only actions that cross the server are recorded, which is why the admin mutations that matter
// for accountability — approving, verifying, featuring, suspending, deleting — were moved off
// direct client-SDK writes to do this. An audit log that silently misses half the actions is
// worse than none, because it invites you to trust it.

export type AuditAction =
  | 'application.approve'
  | 'application.reject'
  | 'review.moderate'
  | 'review.delete'
  | 'listing.status'
  | 'listing.verify'
  | 'listing.feature'
  | 'listing.delete'
  | 'listing.restore'
  | 'listing.purge'
  | 'inquiry.update'
  | 'tutor.verification.approve'
  | 'tutor.verification.reject'
  | 'settings.update'
  | 'analytics.recompute'
  | 'counters.repair'
  | 'database.seed'
  | 'task.run';

export type AuditTargetType = 'institution' | 'tutor' | 'employer' | 'application' | 'review' | 'job' | 'system';

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorRole: string;
  // Absent for a scheduler, which has no user behind it.
  actorEmail?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  // One human-readable line, written at the call site where the intent is known — reconstructing
  // it later from action + ids loses the part a reader actually needs.
  summary: string;
  // Small, non-sensitive extras: the before/after of a status change, a count of rows repaired.
  metadata?: Record<string, string | number | boolean | null>;
  ip?: string;
  createdAt: string;
}
