import { LocalizedString } from './masterData';

// Weekly recurring availability, e.g. { dayOfWeek: 1, startTime: '16:00', endTime: '18:00' } = every Monday 4-6pm
export interface AvailabilitySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // 'HH:MM' 24h
  endTime: string; // 'HH:MM' 24h
  // Opt-in per slot, since a tutor may want group sessions on some slots but stay 1:1 on others
  // (e.g. a review slot right before an exam). Absent/false means individual-only.
  allowsGroup?: boolean;
}

// Shape of tutors/{id}/private/verification — see the note on Tutor.status below for why
// documents and their review status live off the public tutor doc.
export interface TutorVerificationRequest {
  documents: string[];
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Tutor {
  id: string;
  userId?: string;
  slug?: string; // human-readable URL slug; optional since tutors created before this field lack one — /tutors/[slug] falls back to id
  fullName: LocalizedString;
  title: LocalizedString; // e.g. 'Senior Baccalaureate Physics Instructor / أستاذ الفيزياء للفرع العلمي'
  bio: LocalizedString;
  photoUrl: string;

  governorateId: string;
  cityId?: string;
  coordinates?: { lat: number; lng: number }; // set via a one-tap "Use my location" in the tutor dashboard, no map/geocoding

  hourlyRate: {
    iqd: number; // e.g. 35000 — price for a 1:1 individual session
    usd: number; // e.g. 25
  };

  // Group session total price (the whole pot), split evenly across however many students join.
  groupRate: {
    iqd: number;
    usd: number;
  };
  groupMaxSize: number; // e.g. 4 — max students per group session

  availability: AvailabilitySlot[]; // weekly recurring pattern
  unavailableDates?: string[]; // 'YYYY-MM-DD' dates the tutor has blocked off despite a matching weekly slot (vacation, etc.)

  deliveryMode: ('ONLINE' | 'IN_PERSON' | 'HYBRID')[];
  subjectIds: string[]; // References taxonomy item IDs (e.g. 'sub-physics-wazari', 'sub-math')
  studentLevelIds: string[]; // e.g. 'level-baccalaureate', 'level-university'
  
  whatsappNumber: string;
  phone: string;
  yearsOfExperience: number;
  
  isVerified: boolean;
  verificationBadgeLabel: LocalizedString;
  // Verification document URLs are NOT stored here — this doc is world-readable once status is
  // 'ACTIVE', so they live in the private tutors/{id}/private/verification subcollection instead
  // (see MasterDataService.getTutorVerificationDocuments/saveTutorVerificationDocuments).
  // PENDING = awaiting admin approval, never self-settable; SUSPENDED = paused by the tutor
  // themselves from their dashboard. Keeping these distinct is what lets firestore.rules allow
  // an owner to pause/unpause (ACTIVE<->SUSPENDED) without also letting an unapproved tutor
  // walk themselves from PENDING to ACTIVE.
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';

  // Mirrors the private verification doc's `status`, kept in sync by /api/tutor/verification/submit
  // and /api/admin/tutors/[id]/verification/{approve,reject} — a non-sensitive enum (no document
  // URLs), public on this doc purely so the admin tutors list can filter/display it without an
  // extra read per tutor. Absent means 'NONE' (never submitted).
  verificationRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

  ratingAvg: number; // derived, always ratingSum / reviewCount rounded to 1dp
  reviewCount: number;
  // Sum of every approved review's rating — see the note on Institution['metrics'].ratingSum.
  ratingSum?: number;
  
  createdAt: string;
  updatedAt: string;
}
