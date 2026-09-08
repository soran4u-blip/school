export type ErrorSeverity = 'warning' | 'error' | 'fatal';

export interface ErrorLog {
  id: string; // deterministic fingerprint hash — see upsertErrorLog — so repeats of the same error dedupe into one row instead of flooding the log
  source: 'client' | 'server';
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  url?: string; // most recent occurrence's URL
  userAgent?: string;
  role?: string; // custom claim role of whoever hit this, if known (student/tutor/institution/...)
  count: number; // occurrences of this fingerprint
  createdAt: string; // first occurrence
  lastSeenAt: string; // most recent occurrence
}
