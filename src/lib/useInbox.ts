'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, onSnapshot, query, updateDoc, where, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/core/firebase/config';
import { Conversation, ChatMessage } from '@/core/types/conversation';
import { Thread, ThreadMessage } from '@/core/types/message';
import { Booking } from '@/core/types/booking';
import { Inquiry } from '@/core/types/review';
import { BookingView } from '@/core/types/bookingView';
import {
  subscribeToThreadMessages,
  subscribeToTutorThreads,
  subscribeToInstitutionThreads,
  subscribeToStudentThreads,
  markThreadRead,
  sendInstitutionMessage,
} from '@/core/services/messagingService';
import { subscribeToTutorBookings } from '@/core/services/bookingService';
import { subscribeToInstitutionInquiries } from '@/core/services/reviewService';

/**
 * One inbox over the app's two messaging stores.
 *
 * They are not merged at the data layer, because they model different things and can't be
 * collapsed without losing something: `conversations` are strictly 1:1 between two Auth uids,
 * while `threads` are context-scoped (a booking or an inquiry), can hold several students at
 * once, and support people who have no account at all — a parent can message a school with only
 * a phone number. Forcing threads into conversations would drop guest messaging entirely.
 *
 * So the merge happens here instead: this hook normalises both into one list, so /messages can
 * be the single place a user looks rather than showing "0 conversations" while their booking
 * chat lives somewhere else.
 */

export type InboxSource = 'conversation' | 'booking' | 'inquiry';

export interface InboxItem {
  key: string; // unique across sources — `${source}:${id}`
  id: string; // conversationId, bookingId or inquiryId
  source: InboxSource;
  name: string; // who the user is talking to
  role?: string;
  phone?: string;
  context?: string; // e.g. the session date, or "Inquiry"
  lastMessageText?: string;
  lastMessageAt?: string;
  unread: boolean;
  unreadCount: number;
}

type Role = 'student' | 'tutor' | 'institution' | 'employer' | 'admin' | undefined;

interface Identity {
  uid: string;
  role: Role;
  phone?: string;
  // The role-scoped directory id a thread is keyed by, and what readBy entries use.
  ownerId?: string;
}

export function useInbox() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingViews, setBookingViews] = useState<BookingView[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryNames, setInquiryNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [activeKey, setActiveKeyState] = useState<string | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | ThreadMessage)[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIdentity(null);
        setConversations([]);
        setThreads([]);
        setLoading(false);
        return;
      }
      const token = await user.getIdTokenResult();
      const role = token.claims.role as Role;
      setIdentity({
        uid: user.uid,
        role,
        phone: token.claims.phone as string | undefined,
        ownerId:
          role === 'tutor' ? (token.claims.tutorId as string | undefined)
          : role === 'institution' ? (token.claims.institutionId as string | undefined)
          : user.uid,
      });
    });
    return () => unsub();
  }, []);

  // Conversations — every role has these.
  useEffect(() => {
    if (!identity) return;
    const unsub = onSnapshot(
      query(collection(db, 'conversations'), where('participantIds', 'array-contains', identity.uid)),
      (snap) => {
        setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Conversation));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [identity]);

  // Threads, plus whichever context documents carry the counterparty's name. Each role already
  // has a subscription that supplies those names keyed by the same id the thread uses.
  useEffect(() => {
    if (!identity) return;
    const unsubs: Unsubscribe[] = [];

    if (identity.role === 'tutor' && identity.ownerId) {
      unsubs.push(subscribeToTutorThreads(identity.ownerId, setThreads));
      unsubs.push(subscribeToTutorBookings(identity.ownerId, setBookings));
    } else if (identity.role === 'institution' && identity.ownerId) {
      unsubs.push(subscribeToInstitutionThreads(identity.ownerId, setThreads));
      unsubs.push(subscribeToInstitutionInquiries(identity.ownerId, setInquiries));
    } else if (identity.role === 'student') {
      unsubs.push(subscribeToStudentThreads(identity.uid, identity.phone, setThreads));
      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookingViews'), where('studentId', '==', identity.uid)),
          (snap) => setBookingViews(snap.docs.map((d) => d.data() as BookingView))
        )
      );
      // The student's own inquiries aren't client-readable (the rules scope them to the receiving
      // institution), so the institution names come from the account API instead — one call.
      fetch('/api/account/inquiries')
        .then((res) => res.json())
        .then((data) => {
          if (!data?.success) return;
          const names: Record<string, string> = {};
          for (const inq of data.inquiries || []) {
            const label = inq.institutionName?.en || inq.institutionName?.ar;
            if (label) names[inq.id] = label;
          }
          setInquiryNames(names);
        })
        .catch(() => {});
    }

    return () => unsubs.forEach((u) => u());
  }, [identity]);

  const items = useMemo<InboxItem[]>(() => {
    if (!identity) return [];
    const readerId = identity.ownerId || identity.uid;

    const bookingById = new Map(bookings.map((b) => [b.id, b]));
    const viewByBookingId = new Map(bookingViews.map((v) => [v.bookingId, v]));
    const inquiryById = new Map(inquiries.map((i) => [i.id, i]));

    const fromConversations: InboxItem[] = conversations.map((conv) => {
      const other = conv.participants?.find((p) => p.id !== identity.uid);
      const unreadCount = conv.unreadCounts?.[identity.uid] || 0;
      return {
        key: `conversation:${conv.id}`,
        id: conv.id,
        source: 'conversation',
        name: other?.name || 'User',
        role: other?.role,
        phone: other?.phone,
        context: conv.context?.title,
        lastMessageText: conv.lastMessage?.text,
        lastMessageAt: conv.lastMessage?.createdAt || conv.updatedAt,
        unread: unreadCount > 0,
        unreadCount,
      };
    });

    const fromThreads: InboxItem[] = threads.map((th) => {
      const isInquiry = Boolean(th.institutionId);
      const booking = bookingById.get(th.id);
      const view = viewByBookingId.get(th.id);
      const inquiry = inquiryById.get(th.id);

      let name = '';
      let context: string | undefined;
      let phone: string | undefined;

      if (isInquiry) {
        // An institution sees who wrote in; a student sees which institution they wrote to.
        name = inquiry?.fullName || inquiryNames[th.id] || 'Inquiry';
        phone = inquiry?.phone;
        context = 'Inquiry';
      } else if (booking) {
        name = booking.participants?.map((p) => p.name).join(', ') || 'Student';
        phone = booking.participants?.[0]?.phone;
        context = `${booking.date} · ${booking.startTime}`;
      } else if (view) {
        name = view.tutorName?.en || view.tutorName?.ar || 'Tutor';
        phone = view.tutorWhatsapp || undefined;
        context = `${view.date} · ${view.startTime}`;
      } else {
        name = 'Conversation';
      }

      const readAt = th.readBy?.[readerId];
      const unread =
        th.lastMessageSenderId !== readerId && (!readAt || (th.lastMessageAt || '') > readAt);

      return {
        key: `${isInquiry ? 'inquiry' : 'booking'}:${th.id}`,
        id: th.id,
        source: isInquiry ? 'inquiry' : 'booking',
        name,
        phone,
        context,
        lastMessageText: th.lastMessagePreview,
        lastMessageAt: th.lastMessageAt,
        unread,
        unreadCount: unread ? 1 : 0,
      };
    });

    return [...fromConversations, ...fromThreads].sort((a, b) =>
      (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '')
    );
  }, [identity, conversations, threads, bookings, bookingViews, inquiries, inquiryNames]);

  // Selecting is the moment the message list starts loading, so the flag is set here rather than
  // synchronously inside the subscription effect (see react-hooks/set-state-in-effect).
  const setActiveKey = useCallback((key: string | null) => {
    setActiveKeyState(key);
    setMessagesLoading(Boolean(key));
  }, []);

  const activeItem = useMemo(() => items.find((i) => i.key === activeKey) || null, [items, activeKey]);
  const totalUnread = useMemo(() => items.reduce((sum, i) => sum + i.unreadCount, 0), [items]);

  // Opening an item subscribes to whichever message collection backs it and clears its unread
  // marker — the two stores track "read" differently, so each gets its own treatment.
  useEffect(() => {
    messagesUnsubRef.current?.();
    messagesUnsubRef.current = null;

    // No synchronous setState here: clearing belongs in this effect's cleanup (below), and the
    // loading flag is flipped by selectItem, which is the event that actually changes selection.
    if (!activeItem || !identity) return;

    if (activeItem.source === 'conversation') {
      const unsub = onSnapshot(
        query(collection(db, 'conversations', activeItem.id, 'messages')),
        (snap) => {
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as ChatMessage)
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
          setMessages(list);
          setMessagesLoading(false);
        },
        () => setMessagesLoading(false)
      );
      messagesUnsubRef.current = unsub;
      updateDoc(doc(db, 'conversations', activeItem.id), {
        [`unreadCounts.${identity.uid}`]: 0,
      }).catch(() => {});
    } else {
      messagesUnsubRef.current = subscribeToThreadMessages(activeItem.id, (loaded) => {
        setMessages(loaded);
        setMessagesLoading(false);
      });
      markThreadRead(activeItem.id, identity.ownerId || identity.uid).catch(() => {});
    }

    return () => {
      messagesUnsubRef.current?.();
      messagesUnsubRef.current = null;
      setMessages([]);
    };
  }, [activeItem, identity]);

  // Each kind of item is written through a different endpoint: conversations and booking threads
  // go via the Admin SDK so the other side gets a push, and an institution answers its own
  // inquiry threads with a direct client write (firestore.rules already permits the owner).
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const body = text.trim();
      if (!body || !activeItem || !identity) return false;
      setSending(true);
      try {
        if (activeItem.source === 'conversation') {
          const res = await fetch(`/api/conversations/${activeItem.id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: body }),
          });
          return res.ok;
        }

        if (activeItem.source === 'booking') {
          const endpoint =
            identity.role === 'tutor'
              ? `/api/tutor/bookings/${activeItem.id}/messages`
              : `/api/account/bookings/${activeItem.id}/messages`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: body }),
          });
          return res.ok;
        }

        // Inquiry thread
        if (identity.role === 'institution') {
          const inquiry = inquiries.find((i) => i.id === activeItem.id);
          if (!inquiry) return false;
          await sendInstitutionMessage(inquiry, activeItem.name || 'Institution', body);
          return true;
        }
        const res = await fetch(`/api/account/inquiries/${activeItem.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: body }),
        });
        return res.ok;
      } catch {
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeItem, identity, inquiries]
  );

  useEffect(() => () => messagesUnsubRef.current?.(), []);

  /**
   * Whether a message is the current user's own. The two stores record the sender differently —
   * a conversation message carries the sender's uid, a thread message only carries the role that
   * wrote it — so the comparison has to live where the identity is known.
   */
  const isOwnMessage = useCallback(
    (message: ChatMessage | ThreadMessage): boolean => {
      if (!identity) return false;
      if ('senderId' in message && message.senderId) return message.senderId === identity.uid;
      const role = (message as ThreadMessage).senderRole;
      return identity.role === 'institution' ? role === 'institution'
        : identity.role === 'tutor' ? role === 'tutor'
        : role === 'student';
    },
    [identity]
  );

  return {
    isOwnMessage,
    items,
    activeKey,
    setActiveKey,
    activeItem,
    messages,
    loading,
    messagesLoading,
    sending,
    totalUnread,
    currentUserId: identity?.uid ?? null,
    send,
  };
}
