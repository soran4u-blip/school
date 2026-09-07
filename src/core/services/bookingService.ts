import { Booking } from '../types/booking';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

/* =========================================================
   BOOKINGS (tutor's own — read/manage via client SDK; creation
   and group-join price splitting happen server-side, see /api/bookings)
========================================================= */
export async function getTutorBookings(tutorId: string): Promise<Booking[]> {
  const q = query(collection(db, 'bookings'), where('tutorId', '==', tutorId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Booking))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  await updateDoc(doc(db, 'bookings', id), { status });
}

export async function getAllBookings(): Promise<Booking[]> {
  const snap = await getDocs(collection(db, 'bookings'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Booking))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}
