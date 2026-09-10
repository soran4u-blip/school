import { Booking } from '../types/booking';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

/* =========================================================
   BOOKINGS (tutor's own — read/manage via client SDK; creation
   and group-join price splitting happen server-side, see /api/bookings)
========================================================= */
// Live: a new booking request, or a status change made elsewhere (e.g. by an admin), shows up on
// the tutor dashboard without a manual refresh.
export function subscribeToTutorBookings(tutorId: string, cb: (bookings: Booking[]) => void): Unsubscribe {
  const q = query(collection(db, 'bookings'), where('tutorId', '==', tutorId));
  return onSnapshot(q, (snap) => {
    const bookings = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Booking))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    cb(bookings);
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  const snap = await getDocs(collection(db, 'bookings'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Booking))
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
}
