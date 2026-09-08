import { Firestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

// Fixed-window rate limiter backed by Firestore — good enough for abuse prevention on
// low-volume guest-content endpoints (reviews, community posts, job applications); not meant
// for high-throughput APIs. `key` should already encode both the identity (uid or IP) and the
// action (e.g. `review:${uid}`, `ip:1.2.3.4:community-post`) so different actions don't share
// a budget.
export async function checkRateLimit(
  adminDb: Firestore,
  key: string,
  opts: { max: number; windowMinutes: number }
): Promise<{ allowed: boolean }> {
  const ref = adminDb.collection('rateLimits').doc(key.replace(/\//g, '_'));
  const now = Date.now();
  const windowMs = opts.windowMinutes * 60 * 1000;

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { count: number; windowStart: number }) : null;

    if (!data || now - data.windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
      return { allowed: true };
    }
    if (data.count >= opts.max) {
      return { allowed: false };
    }
    tx.update(ref, { count: data.count + 1 });
    return { allowed: true };
  });
}

// Best-effort client IP extraction behind Cloud Run/App Hosting's proxy layer. Not
// spoof-proof against a determined attacker (nothing at this layer of the stack is), but
// sufficient to stop naive repeated-submission abuse from a single source.
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
