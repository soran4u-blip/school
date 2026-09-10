// Sanitized per-(booking, participant) mirror of a Booking — see firestore.rules for why this
// exists instead of letting a student read the Booking doc directly. Doc id is
// `${bookingId}_${studentId}`. Written only by the Admin SDK; a client only ever reads its own
// (studentId == request.auth.uid).
export interface BookingView {
  id: string; // == `${bookingId}_${studentId}`
  bookingId: string;
  studentId: string;
  tutorId: string;
  tutorName: { ar: string; en: string } | null;
  tutorWhatsapp: string | null;
  type: 'INDIVIDUAL' | 'GROUP';
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  pricePerStudent: { iqd: number; usd: number };
  groupSize?: number;
  maxGroupSize?: number;
}
