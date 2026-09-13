'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/config';
import { NotificationItem } from '@/core/types/notification';

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.1); // A5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Audio may be muted or blocked by autoplay policy
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const initialLoadRef = useRef(true);
  const prevCountRef = useRef(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', user.uid)
      );

      const unsubSnap = onSnapshot(
        q,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as NotificationItem[];

          // Sort in memory by createdAt descending
          items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

          const currentUnread = items.filter((item) => !item.read).length;

          // If new unread notification arrived after initial load, play sound
          if (!initialLoadRef.current && currentUnread > prevCountRef.current) {
            playChime();
          }

          initialLoadRef.current = false;
          prevCountRef.current = currentUnread;

          setNotifications(items.slice(0, 30));
          setUnreadCount(currentUnread);
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch {
      // Fallback to API route if client SDK direct update fails
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', { method: 'POST' });
    } catch {
      // Best effort
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}
