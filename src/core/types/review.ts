export interface Review {
  id: string;
  // Exactly one of these is set, depending on what's being reviewed.
  institutionId?: string;
  tutorId?: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  // A single public reply from whoever is being reviewed (tutor for now — institutions have
  // no login yet). Not a back-and-forth thread, just one owner response, same as most review
  // platforms.
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
  email?: string;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt: string;
}
