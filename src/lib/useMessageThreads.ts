'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { ThreadMessage } from '@/core/types/message';
import { subscribeToThreadMessages, markThreadRead } from '@/core/services/messagingService';

// Owner-side message threads, one per context document (an inquiry for an institution, a booking
// for a tutor). The institution and tutor dashboards each carried five pieces of thread state and
// an identical `toggleThread` — the only genuine difference between them was how a message gets
// sent, which is the one thing this takes as a parameter.
//
// Threads load lazily on first expand and are cached for the life of the page: reopening a thread
// costs nothing, which matters because the owner triaging a queue opens and closes many of them.

export interface MessageThreads {
  expandedId: string | null;
  loadingId: string | null;
  sendingId: string | null;
  messages: Record<string, ThreadMessage[]>;
  draftFor: (threadId: string) => string;
  setDraft: (threadId: string, text: string) => void;
  toggle: (threadId: string) => Promise<void>;
  send: (threadId: string) => Promise<void>;
}

/**
 * @param sendMessage Posts the text and resolves with the stored message, or null if it failed.
 *                    Anything that has to happen alongside the send (an institution moving an
 *                    inquiry from NEW to CONTACTED, say) belongs in here.
 * @param readerId    This reader's own id (tutorId/institutionId, or a participant student's uid)
 *                    — written to the thread's `readBy` map whenever a thread is expanded, so the
 *                    unread badge clears. Omit to skip read-tracking (e.g. no owner identity yet).
 */
export function useMessageThreads(
  sendMessage: (threadId: string, text: string) => Promise<ThreadMessage | null>,
  readerId?: string
): MessageThreads {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const unsubRef = useRef<Unsubscribe | null>(null);

  const toggle = useCallback(
    async (threadId: string) => {
      unsubRef.current?.();
      unsubRef.current = null;

      if (expandedId === threadId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(threadId);
      setLoadingId(threadId);
      unsubRef.current = subscribeToThreadMessages(threadId, (loaded) => {
        setMessages((prev) => ({ ...prev, [threadId]: loaded }));
        setLoadingId(null);
      });
      if (readerId) markThreadRead(threadId, readerId).catch(() => {});
    },
    [expandedId, readerId]
  );

  const send = useCallback(
    async (threadId: string) => {
      const text = drafts[threadId]?.trim();
      if (!text) return;
      setSendingId(threadId);
      try {
        const sent = await sendMessage(threadId, text);
        if (!sent) return;
        setMessages((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), sent] }));
        setDrafts((prev) => ({ ...prev, [threadId]: '' }));
        if (readerId) markThreadRead(threadId, readerId).catch(() => {});
      } finally {
        setSendingId(null);
      }
    },
    [drafts, sendMessage, readerId]
  );

  const setDraft = useCallback((threadId: string, text: string) => {
    setDrafts((prev) => ({ ...prev, [threadId]: text }));
  }, []);

  const draftFor = useCallback((threadId: string) => drafts[threadId] || '', [drafts]);

  useEffect(() => () => unsubRef.current?.(), []);

  return { expandedId, loadingId, sendingId, messages, draftFor, setDraft, toggle, send };
}
