import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { threadMessageSchema } from '@/core/validation/schemas';
import { dispatchNotification } from '@/core/server/notifications';
import { Conversation, ChatMessage } from '@/core/types/conversation';
import { FieldValue } from 'firebase-admin/firestore';

// GET /api/conversations/[id]/messages
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { id } = await props.params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const convDoc = await adminDb.collection('conversations').doc(id).get();
  if (!convDoc.exists) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  const conv = convDoc.data() as Conversation;
  if (!conv.participantIds.includes(user.uid)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const snap = await adminDb
    .collection('conversations')
    .doc(id)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get();

  const messages = snap.docs.map((d) => d.data() as ChatMessage);

  // Mark unread count as 0 for current user
  await convDoc.ref.update({
    [`unreadCounts.${user.uid}`]: 0,
  }).catch(() => {});

  return NextResponse.json({ success: true, messages });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { id } = await props.params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, threadMessageSchema);
  if (parsed.error) return parsed.error;
  const { text } = parsed.data;

  const convDoc = await adminDb.collection('conversations').doc(id).get();
  if (!convDoc.exists) {
    return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
  }

  const conv = convDoc.data() as Conversation;
  if (!conv.participantIds.includes(user.uid)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Find recipient participant
  const recipient = conv.participants.find((p) => p.id !== user.uid);
  const sender = conv.participants.find((p) => p.id === user.uid);

  const senderName = parsed.data.senderName || sender?.name || user.role || 'User';
  const now = new Date().toISOString();

  const msgRef = adminDb.collection('conversations').doc(id).collection('messages').doc();
  const newMsg: ChatMessage = {
    id: msgRef.id,
    conversationId: id,
    senderId: user.uid,
    senderName,
    senderRole: (user.role || 'student') as ChatMessage['senderRole'],
    text,
    createdAt: now,
    readBy: [user.uid],
  };

  await msgRef.set(newMsg);

  // Update conversation lastMessage, timestamp, and increment recipient unreadCount
  const updates: Record<string, unknown> = {
    lastMessage: {
      text,
      senderId: user.uid,
      createdAt: now,
    },
    updatedAt: now,
  };
  if (recipient) {
    updates[`unreadCounts.${recipient.id}`] = FieldValue.increment(1);
  }

  await convDoc.ref.update(updates);

  // Trigger in-app notification & Web Push to recipient
  if (recipient) {
    dispatchNotification(adminDb, {
      recipientId: recipient.id,
      recipientRole: recipient.role,
      type: 'CHAT_MESSAGE',
      title: {
        ar: `رسالة جديدة من ${senderName}`,
        en: `New message from ${senderName}`,
      },
      body: {
        ar: text.length > 80 ? `${text.slice(0, 77)}...` : text,
        en: text.length > 80 ? `${text.slice(0, 77)}...` : text,
      },
      linkUrl: `/messages?conversationId=${id}`,
      metadata: {
        conversationId: id,
        senderName,
        senderRole: user.role,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, message: newMsg });
}
