import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Thread, ThreadMessage } from '@/core/types/message';

const MAX_MESSAGE_LENGTH = 2000;

async function loadBookingAndVerifyPhone(bookingId: string, phone: string): Promise<Booking | null> {
  const snap = await adminDb!.collection('bookings').doc(bookingId).get();
  if (!snap.exists) return null;
  const booking = snap.data() as Booking;
  if (!booking.participantPhones?.includes(phone)) return null;
  return booking;
}

// GET /api/bookings/[id]/messages?phone=... — a guest (student) reads their thread for this booking.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const booking = await loadBookingAndVerifyPhone(id, phone);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found for that phone number' }, { status: 404 });
  }

  const messagesSnap = await adminDb
    .collection('threads')
    .doc(id)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .get();

  const messages = messagesSnap.docs.map((d) => d.data() as ThreadMessage);
  return NextResponse.json({ success: true, messages });
}

// POST /api/bookings/[id]/messages — a guest (student) sends a message on their booking thread.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const phone = body?.phone?.trim();
  const text = body?.text?.trim();
  const senderName = body?.senderName?.trim() || 'Student';

  if (!phone || !text) {
    return NextResponse.json({ success: false, error: 'Missing phone or message text' }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ success: false, error: 'Message is too long' }, { status: 400 });
  }

  const booking = await loadBookingAndVerifyPhone(id, phone);
  if (!booking) {
    return NextResponse.json({ success: false, error: 'Booking not found for that phone number' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const threadRef = adminDb.collection('threads').doc(id);
  const messageRef = threadRef.collection('messages').doc();

  const message: ThreadMessage = {
    id: messageRef.id,
    senderRole: 'student',
    senderName,
    text,
    createdAt: now,
  };

  await adminDb.runTransaction(async (tx) => {
    const threadSnap = await tx.get(threadRef);
    if (!threadSnap.exists) {
      const thread: Thread = {
        id,
        tutorId: booking.tutorId,
        participantPhones: booking.participantPhones,
        lastMessageAt: now,
        lastMessagePreview: text.slice(0, 140),
        createdAt: now,
      };
      tx.set(threadRef, thread);
    } else {
      tx.update(threadRef, { lastMessageAt: now, lastMessagePreview: text.slice(0, 140) });
    }
    tx.set(messageRef, message);
  });

  return NextResponse.json({ success: true, message });
}
