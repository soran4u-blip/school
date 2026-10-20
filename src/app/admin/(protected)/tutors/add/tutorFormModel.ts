import { Tutor } from '@/core/types/tutor';
import { deriveVerificationBadge } from '@/lib/utils';

export const emptyForm: Partial<Tutor> = {
  id: '',
  fullName: { ar: '', en: '' },
  title: { ar: '', en: '' },
  bio: { ar: '', en: '' },
  photoUrl: '',
  governorateId: '',
  hourlyRate: { iqd: 0, usd: 0 },
  groupRate: { iqd: 0, usd: 0 },
  groupMaxSize: 4,
  availability: [],
  deliveryMode: ['IN_PERSON'],
  subjectIds: [],
  studentLevelIds: [],
  whatsappNumber: '',
  phone: '',
  yearsOfExperience: 0,
  isVerified: false,
  verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
  status: 'PENDING',
  ratingAvg: 0,
  reviewCount: 0,
};

/** Whether the required fields (ID, both names, governorate) are filled in. */
export function hasRequiredFields(form: Partial<Tutor>): boolean {
  return !!(form.id && form.fullName?.ar && form.fullName?.en && form.governorateId);
}

/** Normalises the loosely-typed form state into a complete Tutor ready to save. Call only after hasRequiredFields. */
export function buildTutor(form: Partial<Tutor>): Tutor {
  const id = (form.id ?? '').toLowerCase().trim().replace(/\s+/g, '-');

  return {
    id,
    fullName: { ar: form.fullName!.ar, en: form.fullName!.en },
    title: { ar: form.title?.ar || '', en: form.title?.en || '' },
    bio: { ar: form.bio?.ar || '', en: form.bio?.en || '' },
    photoUrl: form.photoUrl || 'https://placehold.co/200x200?text=Tutor',
    governorateId: form.governorateId!,
    hourlyRate: { iqd: Number(form.hourlyRate?.iqd) || 0, usd: Number(form.hourlyRate?.usd) || 0 },
    groupRate: { iqd: Number(form.groupRate?.iqd) || 0, usd: Number(form.groupRate?.usd) || 0 },
    groupMaxSize: Number(form.groupMaxSize) || 4,
    availability: form.availability || [],
    deliveryMode: form.deliveryMode?.length ? form.deliveryMode : ['IN_PERSON'],
    subjectIds: form.subjectIds || [],
    studentLevelIds: form.studentLevelIds || [],
    whatsappNumber: form.whatsappNumber || '',
    phone: form.phone || '',
    yearsOfExperience: Number(form.yearsOfExperience) || 0,
    isVerified: form.isVerified ?? false,
    verificationBadgeLabel: deriveVerificationBadge(form.isVerified ?? false, {
      ar: form.verificationBadgeLabel?.ar || 'قيد المراجعة',
      en: form.verificationBadgeLabel?.en || 'Under Review',
    }),
    status: form.status || 'PENDING',
    ratingAvg: form.ratingAvg || 0,
    reviewCount: form.reviewCount || 0,
    createdAt: form.createdAt || '',
    updatedAt: form.updatedAt || '',
  };
}
