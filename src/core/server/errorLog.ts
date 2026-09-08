import crypto from 'crypto';
import { adminDb } from '@/core/firebase/admin';
import { ErrorLog, ErrorSeverity } from '@/core/types/errorLog';

// Lightweight in-house error tracking — no third-party account/DSN needed. Errors land in a
// Firestore collection an admin can browse at /admin/errors. Deliberately best-effort: logging a
// failure should never itself throw or block the caller's actual error handling.
//
// Deduped by a fingerprint of source+severity+message: the same recurring error (e.g. a bug that
// fires on every load of some page) increments one row's `count` instead of writing a fresh
// document per occurrence, which would otherwise flood the log and bury distinct errors under
// thousands of copies of the same one.
async function upsertErrorLog(entry: {
  source: 'client' | 'server';
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  role?: string;
}): Promise<void> {
  if (!adminDb) return;
  try {
    const message = entry.message.slice(0, 2000);
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${entry.source}:${entry.severity}:${message.slice(0, 200)}`)
      .digest('hex')
      .slice(0, 24);
    const ref = adminDb.collection('errorLogs').doc(fingerprint);
    const now = new Date().toISOString();
    const occurrence = {
      source: entry.source,
      severity: entry.severity,
      message,
      stack: entry.stack?.slice(0, 4000),
      url: entry.url,
      userAgent: entry.userAgent,
      role: entry.role,
      lastSeenAt: now,
    };

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        const newEntry: ErrorLog = { id: fingerprint, ...occurrence, count: 1, createdAt: now };
        tx.set(ref, newEntry);
      } else {
        tx.update(ref, { ...occurrence, count: ((snap.data() as ErrorLog).count || 1) + 1 });
      }
    });
  } catch {
    // Never let logging itself break the caller.
  }
}

export async function logServerError(message: string, extra?: { stack?: string; url?: string; role?: string }): Promise<void> {
  await upsertErrorLog({ source: 'server', severity: 'error', message, ...extra });
}

export async function logClientError(
  message: string,
  extra?: { stack?: string; url?: string; userAgent?: string; severity?: ErrorSeverity }
): Promise<void> {
  await upsertErrorLog({ source: 'client', severity: extra?.severity || 'error', message, ...extra });
}
