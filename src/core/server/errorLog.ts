import { adminDb } from '@/core/firebase/admin';
import { ErrorLog } from '@/core/types/errorLog';

// Lightweight in-house error tracking — no third-party account/DSN needed. Errors just land in a
// Firestore collection an admin can browse at /admin/errors. Deliberately best-effort: logging a
// failure should never itself throw or block the caller's actual error handling.
export async function logServerError(message: string, extra?: { stack?: string; url?: string; role?: string }): Promise<void> {
  if (!adminDb) return;
  try {
    const ref = adminDb.collection('errorLogs').doc();
    const entry: ErrorLog = {
      id: ref.id,
      source: 'server',
      message: message.slice(0, 2000),
      stack: extra?.stack?.slice(0, 4000),
      url: extra?.url,
      role: extra?.role,
      createdAt: new Date().toISOString(),
    };
    await ref.set(entry);
  } catch {
    // Never let logging itself break the caller.
  }
}
