'use client';

import { useEffect } from 'react';

// Registers /public/sw.js once per session. This is what push notifications and the PWA install
// prompt both depend on — no UI, just infrastructure.
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
