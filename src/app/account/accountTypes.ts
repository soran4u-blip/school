import { BookingView } from '@/core/types/bookingView';
import { AdmissionApplicationStatus } from '@/core/types/admission';

export interface AccountBooking {
  id: string;
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

export function toAccountBooking(view: BookingView): AccountBooking {
  return {
    id: view.bookingId,
    tutorId: view.tutorId,
    tutorName: view.tutorName,
    tutorWhatsapp: view.tutorWhatsapp,
    type: view.type,
    date: view.date,
    startTime: view.startTime,
    endTime: view.endTime,
    status: view.status,
    pricePerStudent: view.pricePerStudent,
    groupSize: view.groupSize,
    maxGroupSize: view.maxGroupSize,
  };
}

export interface AccountInquiry {
  id: string;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionSlug: string | null;
  institutionWhatsapp: string | null;
  message: string;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  createdAt: string;
}

export interface AccountJobApplication {
  id: string;
  jobId: string;
  jobTitle: { ar: string; en: string } | null;
  institutionId: string | null;
  institutionName: { ar: string; en: string } | null;
  institutionWhatsapp: string | null;
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  createdAt: string;
}

export interface AccountAdmissionApplication {
  id: string;
  institutionId: string;
  institutionName: { ar: string; en: string } | null;
  institutionSlug: string | null;
  programId: string;
  programName: { ar: string; en: string };
  status: AdmissionApplicationStatus;
  message: string | null;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
}
