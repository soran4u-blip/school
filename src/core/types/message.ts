// Phase 1 of the messaging module: a thread per booking, tutor <-> student.
// The thread doc id is always the same as the Booking id (1:1), so no lookup is needed.
// Guests (students) have no account yet — they read/send via a phone-verified API route
// (/api/bookings/[id]/messages), the same guest pattern already used for booking cancel/lookup.
// The tutor is authenticated and reads/writes directly via the client SDK under firestore.rules.

export interface Thread {
  id: string; // == Booking.id
  tutorId: string;
  participantPhones: string[]; // denormalized from the booking, kept for isOwnerTutor-style checks
  lastMessageAt: string;
  lastMessagePreview: string;
  createdAt: string;
}

export interface ThreadMessage {
  id: string;
  senderRole: 'tutor' | 'student';
  senderName: string;
  text: string;
  createdAt: string;
}
