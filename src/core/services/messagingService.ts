import { Inquiry } from '../types/review';
import { Thread, ThreadMessage } from '../types/message';
import { db } from '../firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, query, orderBy, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

/* =========================================================
   MESSAGING — one thread per context (a Booking or an Inquiry), doc id == that context's id.
   Tutor/institution owner side, and a participant student on a booking thread, all read/write
   directly via the client SDK under firestore.rules. The guest (parent/applicant) side of
   inquiries still goes through /api/inquiries/[id]/messages, since inquiries remain phone-based.
========================================================= */

// Live thread messages — used by whichever side (tutor, institution, or a participant student)
// already has direct read access, so the other party's replies show up without reopening the
// thread.
export function subscribeToThreadMessages(contextId: string, cb: (messages: ThreadMessage[]) => void): Unsubscribe {
  const q = query(collection(db, 'threads', contextId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => d.data() as ThreadMessage)));
}

async function sendOwnerMessage(
  thread: Omit<Thread, 'lastMessageAt' | 'lastMessagePreview' | 'lastMessageSenderId' | 'createdAt'>,
  senderRole: 'tutor' | 'institution',
  senderId: string,
  senderName: string,
  text: string
): Promise<ThreadMessage> {
  const now = new Date().toISOString();
  const threadRef = doc(db, 'threads', thread.id);
  const messageRef = doc(collection(db, 'threads', thread.id, 'messages'));

  const message: ThreadMessage = { id: messageRef.id, senderRole, senderName, text, createdAt: now };

  // Reading a thread doc that doesn't exist yet is denied by firestore.rules (it can't evaluate
  // resource.data on nothing), which only stayed invisible so far because a guest's first message
  // — sent via the Admin SDK route, bypassing rules — always created the thread before an owner
  // got here. Job applications have no such guaranteed first guest message, so treat a denied
  // existence check the same as "doesn't exist yet" rather than letting it throw.
  let existingThread;
  try {
    existingThread = await getDoc(threadRef);
  } catch {
    existingThread = null;
  }
  if (existingThread?.exists()) {
    await updateDoc(threadRef, { lastMessageAt: now, lastMessagePreview: text.slice(0, 140), lastMessageSenderId: senderId });
  } else {
    const newThread: Thread = { ...thread, lastMessageAt: now, lastMessagePreview: text.slice(0, 140), lastMessageSenderId: senderId, createdAt: now };
    await setDoc(threadRef, newThread);
  }
  await setDoc(messageRef, message);
  return message;
}

// A tutor sending a booking-thread message now goes through /api/tutor/bookings/[id]/messages
// (Admin SDK) instead of this client-SDK path, since only the server can trigger a push
// notification to the participant student(s).

export async function sendInstitutionMessage(inquiry: Inquiry, senderName: string, text: string): Promise<ThreadMessage> {
  return sendOwnerMessage(
    { id: inquiry.id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    'institution',
    inquiry.institutionId,
    senderName,
    text
  );
}

// Every thread belonging to a tutor, live — used to compute per-booking/total unread counts
// (a thread is unread for the tutor when its last message wasn't sent by the tutor and postdates
// the tutor's own `readBy` entry) without subscribing to each booking's thread individually.
export function subscribeToTutorThreads(tutorId: string, cb: (threads: Thread[]) => void): Unsubscribe {
  const q = query(collection(db, 'threads'), where('tutorId', '==', tutorId));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => d.data() as Thread)));
}

// Marks a thread read by the given reader (tutor's own tutorId, or a participant student's uid).
// Firestore rules restrict a participant student's update to touching only this one map key.
export async function markThreadRead(threadId: string, readerId: string): Promise<void> {
  await updateDoc(doc(db, 'threads', threadId), { [`readBy.${readerId}`]: new Date().toISOString() });
}
