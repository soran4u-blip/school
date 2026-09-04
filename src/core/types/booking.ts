export interface BookingParticipant {
  name: string;
  phone: string;
}

export interface Booking {
  id: string;
  tutorId: string;
  type: 'INDIVIDUAL' | 'GROUP';
  subjectId?: string; // taxonomy item id, when the tutor teaches more than one subject
  date: string; // 'YYYY-MM-DD'
  dayOfWeek: number;
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  maxGroupSize: number; // snapshot of the tutor's setting at booking time; 1 for INDIVIDUAL
  participants: BookingParticipant[];
  participantPhones: string[]; // denormalized from participants[].phone, for lookup-by-phone queries
  pricePerStudent: {
    iqd: number;
    usd: number;
  };
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}
