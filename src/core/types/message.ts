// Messaging module: one thread per context (a Booking or an Inquiry), doc id == that
// context's id (1:1), so no separate lookup is needed. Exactly one of tutorId/institutionId
// is set, mirroring the Review/Inquiry "exactly one owner" pattern.
// Guests (students/parents) have no account requirement — they read/send via a phone-verified
// API route (/api/bookings/[id]/messages, /api/inquiries/[id]/messages), the same guest pattern
// already used for booking cancel/lookup. The tutor/institution owner is authenticated and
// reads/writes directly via the client SDK under firestore.rules. A logged-in student uses the
// authenticated /api/account/* equivalents instead of the guest routes.

export interface Thread {
  id: string; // == Booking.id or Inquiry.id
  tutorId?: string;
  institutionId?: string;
  participantPhones: string[]; // denormalized from the booking/inquiry, kept for owner checks
  // Denormalized from Booking.participantStudentIds (booking threads only), so a participant
  // student can be granted direct read/limited-update access in firestore.rules without a thread
  // doc lookup back to the booking.
  participantStudentIds?: string[];
  lastMessageAt: string;
  lastMessagePreview: string;
  // Who sent the last message: the tutorId/institutionId for an owner-sent message, or the
  // sending student's uid — lets a reader tell "is the last message mine or theirs" without
  // fetching the message itself, which is what the unread badges are computed from.
  lastMessageSenderId: string;
  createdAt: string;
  // Per-reader last-read timestamps. Tutor/institution owners write their own key directly
  // (firestore.rules has no field restriction for them); a participant student may only ever
  // touch their own key here (see the isParticipantStudent update rule).
  readBy?: Record<string, string>;
}

export interface ThreadMessage {
  id: string;
  senderRole: 'tutor' | 'institution' | 'student';
  senderName: string;
  text: string;
  createdAt: string;
}
