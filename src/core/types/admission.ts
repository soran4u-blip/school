import { LocalizedString } from './masterData';

export type AdmissionApplicationStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'WAITLISTED'
  | 'REJECTED'
  | 'WITHDRAWN';

// A student's application to a specific InstitutionProgram. Creation and status decisions both
// go through Admin SDK API routes rather than direct client SDK writes (unlike JobApplication) —
// deadlines and per-program capacity need server-validated, transactional enforcement that a
// bare Firestore security rule can't safely provide across two documents (the application and
// the institution's denormalized acceptedCount).
export interface AdmissionApplication {
  id: string;
  institutionId: string;
  programId: string;
  programName: LocalizedString; // snapshot at application time, survives later program edits/removal
  studentId: string;
  studentName: string; // snapshot from the student's account at application time
  studentPhone: string;
  studentEmail: string;
  message?: string; // student's personal statement, optional
  documentUrls?: string[]; // storage paths (not resolved URLs) — the student has no read access, only write
  status: AdmissionApplicationStatus;
  decisionNote?: string; // institution's note, shown to the student alongside the decision
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
}
