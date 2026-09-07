import { LocalizedString } from './masterData';

export interface Job {
  id: string;
  institutionId: string;
  institutionName?: string; // denormalized, like Inquiry.institutionName
  institutionLogoUrl?: string; // denormalized for card display without an extra fetch
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
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  institutionId: string; // denormalized, for owner-scoped rules
  jobTitle?: LocalizedString; // denormalized, avoids a Job fetch for every list row
  fullName: string;
  phone: string;
  email?: string;
  // Storage path (not a resolved download URL) — the applicant who uploads it has no read access
  // under storage.rules, only write. Resolve via resolveDownloadURL() from a session that does
  // (the owning institution), never store a pre-resolved URL here.
  // Required by firestore.rules for new submissions (the apply form enforces it client-side too);
  // still optional in the type since applications created before that requirement lack it.
  resumeUrl?: string;
  coverLetter?: string;
  status: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';
  // Institution-only private note about the applicant, never shown to the applicant.
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}
