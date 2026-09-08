import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AdmissionApplication } from '../types/admission';

// An institution's own admission applications across all its programs (isOwnerInstitution rule
// scopes this to their own docs only). Status decisions are NOT made here — they go through the
// transactional /api/institution/admission-applications/[id]/decision route, since accepting an
// applicant has to atomically check the program's capacity.
export async function getInstitutionAdmissionApplications(institutionId: string): Promise<AdmissionApplication[]> {
  const q = query(collection(db, 'admissionApplications'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as AdmissionApplication))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
