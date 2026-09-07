export type ApplicationType = 'TUTOR' | 'INSTITUTION' | 'EMPLOYER';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
}
