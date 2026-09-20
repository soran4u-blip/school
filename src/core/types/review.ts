export interface Review {
  id: string;
  // Exactly one of these is set, depending on what's being reviewed.
  institutionId?: string;
  tutorId?: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  // Set only by the Admin SDK (/api/reviews), never by a client create — see firestore.rules'
  // isValidReview(). `verified` is true only when the reviewer had a real completed/confirmed
  // booking with this tutor at submission time.
  studentId?: string;
  verified?: boolean;
  createdAt: string;
  // A single public reply from whoever is being reviewed (tutor or institution). Not a
  // back-and-forth thread, just one owner response, same as most review platforms.
  reply?: {
    text: string;
    createdAt: string;
  };
}

export interface Inquiry {
  id: string;
  institutionId: string;
  institutionName?: string;
  fullName: string;
  phone: string;
  // Set when the submitter was signed in at submission time, so /api/account/inquiries can find
  // it reliably even if the phone typed into the form doesn't match the account's phone claim.
  studentId?: string;
  email?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'APPLICATION_STARTED' | 'CLOSED';
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
  tags?: string[];
  nextFollowUpAt?: string;
  reminderSentAt?: string;
  firstResponseAt?: string;
  lastResponseAt?: string;
  firstResponseMinutes?: number;
  closedAt?: string;
}
