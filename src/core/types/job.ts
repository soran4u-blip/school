import { LocalizedString } from './masterData';

export interface Job {
  id: string;
  slug?: string; // human-readable URL slug; optional since jobs created before this field lack one — /jobs/[slug] falls back to id
  // Exactly one of these is set, depending on who posted it — same "exactly one owner" pattern
  // as Review's institutionId?/tutorId?.
  institutionId?: string;
  employerId?: string;
  posterName?: string; // denormalized institution/employer name, avoids an extra fetch per card
  posterLogoUrl?: string; // denormalized
  posterType?: 'COMPANY' | 'NGO'; // set only when employerId is set, drives the public badge
  title: LocalizedString;
  description: LocalizedString;
  responsibilities?: LocalizedString;
  requirements?: LocalizedString;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR';
  subjectIds?: string[]; // taxonomy SUBJECT items, for teaching roles
  governorateId: string;
  isRemote: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: 'USD' | 'IQD';
  applicationDeadline?: string; // 'YYYY-MM-DD'
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  applicantCount?: number; // denormalized, incremented atomically by /api/job-applications — avoids scanning the whole jobApplications collection just to show a per-job count
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  // Exactly one of these is set, denormalized from the job at submit time — for owner-scoped
  // rules AND because a list query's `where` field must match the field firestore.rules inspects.
  institutionId?: string;
  employerId?: string;
  jobTitle?: LocalizedString; // denormalized, avoids a Job fetch for every list row
  // Set only when the applicant was signed in as a student at submit time — lets
  // /api/account/job-applications list an authenticated applicant's own submissions the same way
  // admissionApplications.studentId does. Guest applicants (the common case) leave this unset.
  studentId?: string;
  fullName: string;
  phone: string;
  email?: string;
  // Storage path (not a resolved download URL) — the applicant who uploads it has no read access
  // under storage.rules, only write. Resolve via resolveDownloadURL() from a session that does
  // (the owning institution/employer), never store a pre-resolved URL here.
  // Required by firestore.rules for new submissions (the apply form enforces it client-side too);
  // still optional in the type since applications created before that requirement lack it.
  resumeUrl?: string;
  coverLetter?: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  // Institution/employer-only private note about the applicant, never shown to the applicant.
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
