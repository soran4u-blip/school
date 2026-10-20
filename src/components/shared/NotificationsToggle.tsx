'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useT } from '@/lib/useT';
import { NOTIFICATIONS_TOGGLE_COPY } from './SharedPanels.i18n';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Lets a logged-in student opt into web push (booking/admission decision updates) — native
// browser Push API, no app install or third-party notification service required.
export default function NotificationsToggle() {
  const t = useT(NOTIFICATIONS_TOGGLE_COPY);
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      setSupported(true);
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await reg?.pushManager.getSubscription();
      setSubscribed(!!sub);
    }
    check();
  }, []);

  const handleEnable = async () => {
    setError('');
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError(t('allowInBrowser'));
        return;
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      setSubscribed(true);
    } catch {
      setError(t('enableFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  if (!supported) return null;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {subscribed ? <BellRing className="w-4 h-4 text-emerald-600" /> : <Bell className="w-4 h-4 text-slate-400" />}
        <div>
          <p className="text-xs font-bold text-slate-800">{t('title')}</p>
          <p className="text-[11px] text-slate-500">
            {subscribed
              ? t('subscribedHint')
              : t('unsubscribedHint')}
          </p>
          {error && <p className="text-[11px] text-rose-600 font-bold mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={subscribed ? handleDisable : handleEnable}
        disabled={busy}
        className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold disabled:opacity-60 ${
          subscribed ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#0B192C] hover:bg-[#1E3E62] text-white'
        }`}
      >
        {subscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
        {subscribed ? t('disable') : t('enable')}
      </button>
    </div>
  );
}
