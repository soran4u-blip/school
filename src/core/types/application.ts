export type ApplicationType = 'TUTOR' | 'INSTITUTION';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Public "join the platform" applications from prospective tutors or institutions.
// Approval provisions a login for tutors (see /api/applications/[id]/approve); institution
// applications still require the superadmin to create the Institution record by hand, since
// there's no institution-owner login/dashboard yet.
export interface Application {
  id: string;
  type: ApplicationType;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  governorateId: string;
  categoryId?: string; // INSTITUTION only — which directory category they're applying under
  subjectIds?: string[]; // TUTOR only — taxonomy SUBJECT ids
  studentLevelIds?: string[]; // TUTOR only — taxonomy STUDENT_LEVEL ids (grades taught)
  yearsOfExperience?: number; // TUTOR only
  message: string;
  status: ApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  resultTutorId?: string; // set once a TUTOR application is approved and its Tutor doc is created
}
