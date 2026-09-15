import { EduEvent } from '../types/event';
import { db } from '../firebase/config';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { slugify } from '@/lib/slug';

/* =========================================================
   EVENTS
========================================================= */
export async function createEvent(event: Omit<EduEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<EduEvent> {
  const ref = doc(collection(db, 'events'));
  const now = new Date().toISOString();
  const slug = slugify(event.title.en || event.title.ar, ref.id.slice(-6), 'event');
  const newEvent: EduEvent = { ...event, id: ref.id, slug, createdAt: now, updatedAt: now };
  const payload = Object.fromEntries(Object.entries(newEvent).filter(([, v]) => v !== undefined));
  await setDoc(ref, payload);
  return newEvent;
}

export async function updateEvent(id: string, patch: Partial<EduEvent>): Promise<void> {
  await updateDoc(doc(db, 'events', id), { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id));
}

// Direct getDoc, bypassing any bulk-query restriction — mirrors getJobById, so an owner can load
// their own DRAFT/CLOSED event even though a bulk unfiltered query would otherwise be denied.
export async function getEventById(id: string): Promise<EduEvent | null> {
  const snap = await getDoc(doc(db, 'events', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as EduEvent) : null;
}

export async function getInstitutionEvents(institutionId: string): Promise<EduEvent[]> {
  const q = query(collection(db, 'events'), where('institutionId', '==', institutionId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as EduEvent))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function getEmployerEvents(employerId: string): Promise<EduEvent[]> {
  const q = query(collection(db, 'events'), where('employerId', '==', employerId));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as EduEvent))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
