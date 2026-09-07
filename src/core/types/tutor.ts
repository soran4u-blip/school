import { LocalizedString } from './masterData';

// Weekly recurring availability, e.g. { dayOfWeek: 1, startTime: '16:00', endTime: '18:00' } = every Monday 4-6pm
export interface AvailabilitySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // 'HH:MM' 24h
  endTime: string; // 'HH:MM' 24h
}

export interface Tutor {
  id: string;
  userId?: string;
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
  status: 'ACTIVE' | 'PENDING';
  
  ratingAvg: number;
  reviewCount: number;
  
  createdAt: string;
  updatedAt: string;
}
