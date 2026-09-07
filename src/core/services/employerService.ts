import { Employer } from '../types/employer';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

/* =========================================================
   EMPLOYERS (companies/NGOs — narrower than institutions, job-posting only)
========================================================= */
export async function getEmployerById(id: string): Promise<Employer | null> {
  const snap = await getDoc(doc(db, 'employers', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Employer) : null;
}

export async function getAllEmployers(): Promise<Employer[]> {
  const snap = await getDocs(collection(db, 'employers'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Employer))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateEmployerStatus(id: string, status: Employer['status']): Promise<void> {
  await updateDoc(doc(db, 'employers', id), { status, updatedAt: new Date().toISOString() });
}

export async function deleteEmployer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'employers', id));
}
