import { LocalizedString } from './masterData';

export interface InstitutionProgram {
  id: string;
  name: LocalizedString;
  facultyName: LocalizedString;
  degreeLevelId: string; // e.g. 'bachelor', 'master', 'diploma'
  tuitionAnnual: {
    amount: number;
    currency: 'IQD' | 'USD';
  };
  durationYears: number;
  minBaccalaureateScore?: number; // e.g. 85 for Medicine/Pharmacy
  isActive: boolean;

  isAcceptingApplications?: boolean; // institution toggle to pause new admissions; defaults true when isActive
  applicationDeadline?: string; // 'YYYY-MM-DD'; omit for no deadline
  capacity?: number; // seats available this admission cycle; omit for unlimited
  acceptedCount?: number; // denormalized count of ACCEPTED applications, maintained transactionally
}

export interface InstitutionContact {
  phonePrimary: string;
  phoneSecondary?: string;
  whatsappNumber: string; // E.g. '9647801234567'
  email: string;
  website?: string;
  workingHours?: LocalizedString;
}

export interface Institution {
  id: string;
  userId?: string; // linked Firebase Auth uid, once the institution has an owner account
  slug: string;
  name: LocalizedString;
  categoryId: string; // References Category.id (e.g. 'universities', 'schools')
  subcategoryId?: string; // References Subcategory.id
  governorateId: string; // References Governorate.id (e.g. 'baghdad')
  cityId?: string;
  districtId?: string;
  
  logoUrl: string;
  coverImageUrl: string;
  galleryUrls?: string[];
  
  tagline: LocalizedString;
  description: LocalizedString;
  address: LocalizedString;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  contact: InstitutionContact;
  
  establishedYear: number;
  genderPolicy: 'CO_ED' | 'BOYS_ONLY' | 'GIRLS_ONLY';
  languagesOfInstruction: ('AR' | 'EN' | 'KU' | 'FR')[];
  
  tuition: {
    min: number;
    max: number;
    currency: 'IQD' | 'USD';
    period: 'YEAR' | 'SEMESTER' | 'COURSE';
    tierLabel?: '$' | '$$' | '$$$' | '$$$$' | 'FREE';
  };
  
  taxonomyIds: string[]; // References TaxonomyItem.id (accreditations, curricula, facilities)
  
  isVerified: boolean;
  verificationBadgeLabel: LocalizedString; // e.g. 'Ministry of Higher Education Accredited'
  
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  isFeatured: boolean;
  
  metrics: {
    ratingAvg: number; // e.g. 4.9
    reviewCount: number; // e.g. 310
    studentsCount?: number;
    graduateEmploymentRate?: number; // e.g. 94%
  };
  
  programs?: InstitutionProgram[];
  facilities?: string[];
  
  createdAt: string;
  updatedAt: string;
}
