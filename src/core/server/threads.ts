import { Firestore } from 'firebase-admin/firestore';
import { Booking } from '@/core/types/booking';
import { Inquiry } from '@/core/types/review';
import { Thread, ThreadMessage } from '@/core/types/message';

export const MAX_MESSAGE_LENGTH = 2000;

// The shared bit of a Booking or Inquiry a thread actually needs — exactly one of
// tutorId/institutionId is set, mirroring the Review/Inquiry "exactly one owner" pattern.
export interface ThreadContext {
  id: string;
  tutorId?: string;
  institutionId?: string;
  participantPhones: string[];
  participantStudentIds?: string[];
}

export async function loadBookingAndVerifyStudent(adminDb: Firestore, bookingId: string, studentId: string): Promise<Booking | null> {
  const snap = await adminDb.collection('bookings').doc(bookingId).get();
  if (!snap.exists) return null;
  const booking = snap.data() as Booking;
  if (!booking.participantStudentIds?.includes(studentId)) return null;
  return booking;
}

export async function loadInquiryAndVerifyPhone(adminDb: Firestore, inquiryId: string, phone: string): Promise<Inquiry | null> {
  const snap = await adminDb.collection('inquiries').doc(inquiryId).get();
  if (!snap.exists) return null;
  const inquiry = snap.data() as Inquiry;
  if (inquiry.phone !== phone) return null;
  return inquiry;
}

export async function listThreadMessages(adminDb: Firestore, contextId: string): Promise<ThreadMessage[]> {
  const snap = await adminDb.collection('threads').doc(contextId).collection('messages').orderBy('createdAt', 'asc').get();
  return snap.docs.map((d) => d.data() as ThreadMessage);
}

export async function sendThreadMessage(
  adminDb: Firestore,
  context: ThreadContext,
  senderRole: 'tutor' | 'institution' | 'student',
  senderId: string,
  senderName: string,
  text: string
): Promise<ThreadMessage> {
  const now = new Date().toISOString();
  const threadRef = adminDb.collection('threads').doc(context.id);
  const messageRef = threadRef.collection('messages').doc();

  const message: ThreadMessage = { id: messageRef.id, senderRole, senderName, text, createdAt: now };

  await adminDb.runTransaction(async (tx) => {
    const threadSnap = await tx.get(threadRef);
    if (!threadSnap.exists) {
      const thread: Thread = {
        id: context.id,
        ...(context.tutorId && { tutorId: context.tutorId }),
        ...(context.institutionId && { institutionId: context.institutionId }),
        participantPhones: context.participantPhones,
        ...(context.participantStudentIds && { participantStudentIds: context.participantStudentIds }),
        lastMessageAt: now,
        lastMessagePreview: text.slice(0, 140),
        lastMessageSenderId: senderId,
        createdAt: now,
      };
      tx.set(threadRef, thread);
    } else {
      tx.update(threadRef, {
        lastMessageAt: now,
        lastMessagePreview: text.slice(0, 140),
        lastMessageSenderId: senderId,
        ...(context.participantStudentIds && { participantStudentIds: context.participantStudentIds }),
      });
    }
    tx.set(messageRef, message);
  });

  return message;
}
