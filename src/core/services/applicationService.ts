import { Application } from '../types/application';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';

/* =========================================================
   JOIN APPLICATIONS (Tutor / Institution / Employer)
========================================================= */
export async function createApplication(app: Omit<Application, 'id' | 'createdAt' | 'status'>): Promise<Application> {
  const ref = doc(collection(db, 'applications'));
  const newApp: Application = { ...app, id: ref.id, status: 'PENDING', createdAt: new Date().toISOString() };
  // Firestore's client SDK rejects explicit `undefined` field values — drop optional fields the caller left unset.
  const payload = Object.fromEntries(Object.entries(newApp).filter(([, v]) => v !== undefined));
  await setDoc(ref, payload);
  return newApp;
}

export async function getAllApplications(): Promise<Application[]> {
  const snap = await getDocs(collection(db, 'applications'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Application))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function rejectApplication(id: string, rejectionReason?: string): Promise<void> {
  await updateDoc(doc(db, 'applications', id), {
    status: 'REJECTED',
    reviewedAt: new Date().toISOString(),
    ...(rejectionReason ? { rejectionReason } : {}),
  });
}

// Approval provisions a real login (tutors/institutions/employers) via the Admin SDK, so it
// goes through an API route.
export async function approveApplication(id: string): Promise<{ tutorId?: string; resetLink?: string; note?: string }> {
  const res = await fetch(`/api/applications/${id}/approve`, { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Approval failed');
  return data;
}
