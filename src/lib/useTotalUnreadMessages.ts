'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/config';

/**
 * Lightweight hook that returns only the total unread message count for the
 * current user across all their conversations. Used in the Navbar to show a
 * badge on the Messages icon without loading the full conversation payload.
 *
 * The Firestore query mirrors what useConversations already does but is kept
 * separate so the Navbar doesn't accidentally double-subscribe when the
 * Messages page is also mounted.
 */
export function useTotalUnreadMessages(): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setTotal(0);
        return;
      }

      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', user.uid)
      );

      const unsubSnap = onSnapshot(
        q,
        (snapshot) => {
          let count = 0;
          snapshot.docs.forEach((d) => {
            const data = d.data();
            count += (data.unreadCounts?.[user.uid] as number) || 0;
          });
          setTotal(count);
        },
        () => {
          /* best-effort — don't crash Navbar on rules error */
        }
      );

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, []);

  return total;
}
