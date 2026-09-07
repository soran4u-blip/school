import { Booking } from '../types/booking';
import { Inquiry } from '../types/review';
import { Thread, ThreadMessage } from '../types/message';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';

/* =========================================================
   MESSAGING — one thread per context (a Booking or an Inquiry), doc id == that context's id.
   Tutor/institution owner side only — authenticated, direct via client SDK under
   firestore.rules. The guest (student/parent) side goes through /api/bookings/[id]/messages
   or /api/inquiries/[id]/messages instead, since guests have no account to authenticate
   against these rules directly.
========================================================= */
export async function getThreadMessages(contextId: string): Promise<ThreadMessage[]> {
  const q = query(collection(db, 'threads', contextId, 'messages'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ThreadMessage);
}

async function sendOwnerMessage(
  thread: Omit<Thread, 'lastMessageAt' | 'lastMessagePreview' | 'createdAt'>,
  senderRole: 'tutor' | 'institution',
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
    await updateDoc(threadRef, { lastMessageAt: now, lastMessagePreview: text.slice(0, 140) });
  } else {
    const newThread: Thread = { ...thread, lastMessageAt: now, lastMessagePreview: text.slice(0, 140), createdAt: now };
    await setDoc(threadRef, newThread);
  }
  await setDoc(messageRef, message);
  return message;
}

export async function sendTutorMessage(booking: Booking, senderName: string, text: string): Promise<ThreadMessage> {
  return sendOwnerMessage(
    { id: booking.id, tutorId: booking.tutorId, participantPhones: booking.participantPhones },
    'tutor',
    senderName,
    text
  );
}

export async function sendInstitutionMessage(inquiry: Inquiry, senderName: string, text: string): Promise<ThreadMessage> {
  return sendOwnerMessage(
    { id: inquiry.id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    'institution',
    senderName,
    text
  );
}
