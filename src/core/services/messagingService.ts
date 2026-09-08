import { Inquiry } from '../types/review';
import { Thread, ThreadMessage } from '../types/message';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';

/* =========================================================
   MESSAGING — one thread per context (a Booking or an Inquiry), doc id == that context's id.
   Tutor/institution owner side only — authenticated, direct via client SDK under
   firestore.rules. The student side (booking threads) goes through the account-authenticated
   /api/account/bookings/[id]/messages route; the guest (parent/applicant) side of inquiries
   still goes through /api/inquiries/[id]/messages, since inquiries remain phone-based.
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

// A tutor sending a booking-thread message now goes through /api/tutor/bookings/[id]/messages
// (Admin SDK) instead of this client-SDK path, since only the server can trigger a push
// notification to the participant student(s).

export async function sendInstitutionMessage(inquiry: Inquiry, senderName: string, text: string): Promise<ThreadMessage> {
  return sendOwnerMessage(
    { id: inquiry.id, institutionId: inquiry.institutionId, participantPhones: [inquiry.phone] },
    'institution',
    senderName,
    text
  );
}
