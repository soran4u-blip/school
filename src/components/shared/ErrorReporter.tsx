'use client';

import { useEffect } from 'react';

const MAX_REPORTS_PER_SESSION = 20;

// Global, in-house error capture — no third-party account (Sentry, etc.) needed. Reports land in
// Firestore via /api/errors and are visible at /admin/errors. Dedupes identical messages within
// the session and caps total reports so a tight error loop can't hammer the endpoint.
export default function ErrorReporter() {
  useEffect(() => {
    const seen = new Set<string>();
    let count = 0;

    const report = (message: string, stack?: string) => {
      if (count >= MAX_REPORTS_PER_SESSION) return;
      const key = message.slice(0, 200);
      if (seen.has(key)) return;
      seen.add(key);
      count++;

      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, stack, url: window.location.href }),
        keepalive: true,
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      report(event.message || 'Unknown error', event.error?.stack);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      report(`Unhandled rejection: ${message}`, reason instanceof Error ? reason.stack : undefined);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
