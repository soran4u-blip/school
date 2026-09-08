export interface BookingParticipant {
  studentId: string; // the booking student's account uid — identity source, not client-supplied
  name: string; // snapshot of the student's fullName at booking time
  phone: string; // snapshot of the student's phone at booking time, for the tutor to contact them
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
  participantStudentIds: string[]; // denormalized from participants[].studentId, for lookup-by-account queries
  pricePerStudent: {
    iqd: number;
    usd: number;
  };
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  createdAt: string;
  recurringGroupId?: string; // shared across all weekly instances created from one recurring booking request
}
