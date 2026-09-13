'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '@/core/firebase/config';
import { Conversation, ChatMessage } from '@/core/types/conversation';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Flips messagesLoading synchronously in the same event that changes which conversation is
  // active, rather than in the messages effect below — react-hooks/set-state-in-effect rejects a
  // plain "mark loading" setState at the top of an effect body (it wants effects to only
  // subscribe/synchronize, not kick off derived state), and this is the actual moment the loading
  // state changes, not a side effect of it.
  const setActiveConversationId = useCallback((id: string | null) => {
    setActiveConversationIdState(id);
    setMessagesLoading(!!id);
  }, []);

  // Listen to Auth state and user's conversations
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrentUserId(null);
        setConversations([]);
        setActiveConversationId(null);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.uid);
      setLoading(true);

      const q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', user.uid)
      );

      const unsubSnap = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Conversation[];

          // Sort by updatedAt descending
          list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

          setConversations(list);
          setLoading(false);
        },
        () => setLoading(false)
      );

      return () => unsubSnap();
    });

    return () => unsubAuth();
  }, [setActiveConversationId]);

  // Listen to messages of active conversation. Clearing activeMessages happens in this effect's
  // own cleanup (fired when the id changes away or becomes falsy) rather than synchronously at
  // the top of the next run, since a plain reset there is exactly the derived-state-in-effect
  // pattern react-hooks/set-state-in-effect flags — the cleanup is where React expects an effect
  // to undo what it set up. messagesLoading is set by setActiveConversationId above, not here.
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;

    const msgQuery = query(
      collection(db, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMsg = onSnapshot(
      msgQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
        setActiveMessages(msgs);
        setMessagesLoading(false);

        // Reset unread count for current user
        const convRef = doc(db, 'conversations', activeConversationId);
        updateDoc(convRef, {
          [`unreadCounts.${currentUserId}`]: 0,
        }).catch(() => {});
      },
      () => setMessagesLoading(false)
    );

    return () => {
      unsubMsg();
      setActiveMessages([]);
    };
  }, [activeConversationId, currentUserId]);

  // Total unread messages across all conversations
  const totalUnreadCount = useMemo(() => {
    if (!currentUserId) return 0;
    return conversations.reduce((acc, conv) => {
      return acc + (conv.unreadCounts?.[currentUserId] || 0);
    }, 0);
  }, [conversations, currentUserId]);

  // Start or open a conversation with another user
  const startConversation = useCallback(
    async (
      recipientId: string,
      recipientRole: 'student' | 'tutor' | 'institution' | 'employer' | 'admin',
      recipientName: string,
      recipientPhone?: string,
      context?: Conversation['context']
    ): Promise<string | null> => {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            recipientRole,
            recipientName,
            recipientPhone,
            context,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success || !data.conversation) return null;
        setActiveConversationId(data.conversation.id);
        return data.conversation.id as string;
      } catch {
        return null;
      }
    },
    [setActiveConversationId]
  );

  // Send a message to the active conversation
  const sendMessage = useCallback(
    async (conversationId: string, text: string, senderName?: string) => {
      if (!text.trim()) return null;
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, senderName }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) return null;
        return data.message as ChatMessage;
      } catch {
        return null;
      }
    },
    []
  );

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    activeMessages,
    loading,
    messagesLoading,
    totalUnreadCount,
    currentUserId,
    startConversation,
    sendMessage,
  };
}
