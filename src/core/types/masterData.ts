export type SupportedLanguage = 'ar' | 'en' | 'ku';

export interface LocalizedString {
  ar: string;
  en: string;
  ku?: string;
}

export interface Governorate {
  id: string; // e.g. 'baghdad', 'erbil', 'basra'
  name: LocalizedString;
  code: string;
  region: 'CENTRAL' | 'KURDISTAN' | 'SOUTH' | 'WEST' | 'NORTH';
  lat: number;
  lng: number;
  isActive: boolean;
  displayOrder: number;
  institutionsCount?: number;
}

export interface City {
  id: string; // e.g. 'baghdad-karkh', 'baghdad-rusafa', 'erbil-center'
  governorateId: string;
  name: LocalizedString;
  slug: string;
  lat?: number;
  lng?: number;
  isActive: boolean;
  displayOrder: number;
}

export interface District {
  id: string; // e.g. 'al-mansour', 'al-jadriya', 'al-karrada'
  cityId: string;
  governorateId: string;
  name: LocalizedString;
  slug: string;
  isActive: boolean;
}

export type CategorySlug = 
  | 'universities' 
  | 'schools' 
  | 'institutes' 
  | 'training_centers' 
  | 'ngos' 
  | 'tutors';

export interface Category {
  id: string;
  slug: CategorySlug | string;
  name: LocalizedString;
  iconName: string; // Lucide icon name, e.g. 'GraduationCap', 'School', 'BookOpen', 'Award', 'HeartHandshake', 'UserCheck'
  badgeColor?: string;
  description: LocalizedString;
  isActive: boolean;
  displayOrder: number;
  institutionsCount?: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  slug: string;
  name: LocalizedString;
  isActive: boolean;
  displayOrder: number;
}

export type TaxonomyType = 
  | 'ACCREDITATION' 
  | 'CURRICULUM' 
  | 'DEGREE_LEVEL' 
  | 'STUDY_FIELD' 
  | 'SUBJECT' 
  | 'FACILITY' 
  | 'STUDENT_LEVEL';

export interface TaxonomyItem {
  id: string;
  type: TaxonomyType;
  code: string;
  name: LocalizedString;
  badgeStyle?: 'emerald' | 'amber' | 'blue' | 'slate';
  iconName?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface QuickSearchTag {
  id: string;
  label: LocalizedString;
  categoryId?: string;
  governorateId?: string;
  keyword?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface CMSBanner {
  id: string;
  title: LocalizedString;
  subtitle: LocalizedString;
  ctaText?: LocalizedString;
  ctaLink?: string;
  imageUrl?: string;
  location: 'HERO_TOP' | 'DIRECTORY_FEED' | 'ANNOUNCEMENT_STICKY';
  isActive: boolean;
}

export interface SystemSettings {
  siteName: LocalizedString;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;
  exchangeRateUsdToIqd: number; // e.g. 1500
  emergencyAnnouncement?: {
    enabled: boolean;
    text: LocalizedString;
    level: 'INFO' | 'WARNING' | 'ALERT';
  };
}
