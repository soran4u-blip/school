import { Firestore } from 'firebase-admin/firestore';
import { Booking } from '@/core/types/booking';
import { Thread, ThreadMessage } from '@/core/types/message';

export const MAX_MESSAGE_LENGTH = 2000;

export async function loadBookingAndVerifyPhone(adminDb: Firestore, bookingId: string, phone: string): Promise<Booking | null> {
  const snap = await adminDb.collection('bookings').doc(bookingId).get();
  if (!snap.exists) return null;
  const booking = snap.data() as Booking;
  if (!booking.participantPhones?.includes(phone)) return null;
  return booking;
}

export async function listThreadMessages(adminDb: Firestore, bookingId: string): Promise<ThreadMessage[]> {
  const snap = await adminDb.collection('threads').doc(bookingId).collection('messages').orderBy('createdAt', 'asc').get();
  return snap.docs.map((d) => d.data() as ThreadMessage);
}

export async function sendThreadMessage(
  adminDb: Firestore,
  booking: Booking,
  senderRole: 'tutor' | 'student',
  senderName: string,
  text: string
): Promise<ThreadMessage> {
  const now = new Date().toISOString();
  const threadRef = adminDb.collection('threads').doc(booking.id);
  const messageRef = threadRef.collection('messages').doc();

  const message: ThreadMessage = { id: messageRef.id, senderRole, senderName, text, createdAt: now };

  await adminDb.runTransaction(async (tx) => {
    const threadSnap = await tx.get(threadRef);
    if (!threadSnap.exists) {
      const thread: Thread = {
        id: booking.id,
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

  return message;
}
