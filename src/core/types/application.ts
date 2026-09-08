export type ApplicationType = 'TUTOR' | 'INSTITUTION' | 'EMPLOYER';
// APPROVING is a transient in-flight state: the approval route claims the application into this
// state before touching Firebase Auth, so a concurrent duplicate click can't also start
// approving it, and a crash mid-approval leaves a resumable marker instead of silently reverting
// to PENDING (which would let a retry create a second Auth user/profile for the same applicant).
export type ApplicationStatus = 'PENDING' | 'APPROVING' | 'APPROVED' | 'REJECTED';

// Public "join the platform" applications from prospective tutors, institutions, or employers
// (companies/NGOs, who can only post jobs). Approval provisions a login for all three types
// (see /api/applications/[id]/approve).
export interface Application {
  id: string;
  type: ApplicationType;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  governorateId: string;
  categoryId?: string; // INSTITUTION only — which directory category they're applying under
  employerType?: 'COMPANY' | 'NGO'; // EMPLOYER only
  subjectIds?: string[]; // TUTOR only — taxonomy SUBJECT ids
  studentLevelIds?: string[]; // TUTOR only — taxonomy STUDENT_LEVEL ids (grades taught)
  yearsOfExperience?: number; // TUTOR only
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  resultTutorId?: string; // set once a TUTOR application is approved and its Tutor doc is created
  resultInstitutionId?: string; // set once an INSTITUTION application is approved and its Institution doc is created
  resultEmployerId?: string; // set once an EMPLOYER application is approved and its Employer doc is created
  pendingAuthUid?: string; // set as soon as the approval route creates the Auth user, before the profile doc — lets a retry after a crash reuse the same uid instead of creating a duplicate
}
