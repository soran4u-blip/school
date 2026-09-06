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
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  senderRole: 'tutor' | 'institution' | 'student';
  senderName: string;
  text: string;
  createdAt: string;
}
