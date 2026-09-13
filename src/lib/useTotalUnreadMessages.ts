'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/config';
import { Thread } from '@/core/types/message';
import {
  subscribeToTutorThreads,
  subscribeToInstitutionThreads,
  subscribeToStudentThreads,
} from '@/core/services/messagingService';

/**
 * The total unread count for the Navbar badge, across everything /messages shows — direct
 * conversations *and* booking/inquiry threads. Counting only conversations made the badge lie:
 * a tutor with unanswered booking messages saw nothing.
 *
 * Deliberately lighter than useInbox: a count needs no counterparty names, so this skips the
 * bookings/inquiries lookups that the inbox list needs and just subscribes to the two message
 * stores.
 */
export function useTotalUnreadMessages(): number {
  const [conversationUnread, setConversationUnread] = useState(0);
  const [threadUnread, setThreadUnread] = useState(0);

  useEffect(() => {
    let inner: Unsubscribe[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      inner.forEach((u) => u());
      inner = [];

      if (!user) {
        setConversationUnread(0);
        setThreadUnread(0);
        return;
      }

      inner.push(
        onSnapshot(
          query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid)),
          (snapshot) => {
            let count = 0;
            snapshot.docs.forEach((d) => {
              count += (d.data().unreadCounts?.[user.uid] as number) || 0;
            });
            setConversationUnread(count);
          },
          () => {
            /* best-effort — don't crash Navbar on rules error */
          }
        )
      );

      const token = await user.getIdTokenResult().catch(() => null);
      if (!token) return;
      const role = token.claims.role as string | undefined;
      // Threads record "read" per reader id, which is the role-scoped directory id for an owner
      // and the uid for a student.
      const readerId =
        role === 'tutor' ? (token.claims.tutorId as string | undefined)
        : role === 'institution' ? (token.claims.institutionId as string | undefined)
        : user.uid;
      if (!readerId) return;

      const countThreads = (threads: Thread[]) => {
        setThreadUnread(
          threads.filter((th) => {
            if (th.lastMessageSenderId === readerId) return false;
            const readAt = th.readBy?.[readerId];
            return !readAt || (th.lastMessageAt || '') > readAt;
          }).length
        );
      };

      if (role === 'tutor') {
        inner.push(subscribeToTutorThreads(readerId, countThreads));
      } else if (role === 'institution') {
        inner.push(subscribeToInstitutionThreads(readerId, countThreads));
      } else if (role === 'student') {
        inner.push(subscribeToStudentThreads(user.uid, token.claims.phone as string | undefined, countThreads));
      }
    });

    return () => {
      inner.forEach((u) => u());
      unsubAuth();
    };
  }, []);

  return conversationUnread + threadUnread;
}
