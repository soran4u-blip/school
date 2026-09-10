// One-time backfill: writes a sanitized bookingViews/{bookingId}_{studentId} doc for every
// participant of every existing booking, so bookings created before the realtime student
// dashboard shipped show up there too. Safe to re-run (idempotent — same shape syncBookingViews
// writes going forward).
// Usage: node --env-file=.env.local scripts/backfill-booking-views.mjs
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_NAME || 'schooldb');

const bookingsSnap = await db.collection('bookings').get();
console.log(`Found ${bookingsSnap.size} bookings.`);

const tutorCache = new Map();
async function getTutor(tutorId) {
  if (!tutorCache.has(tutorId)) {
    const snap = await db.collection('tutors').doc(tutorId).get();
    tutorCache.set(tutorId, snap.exists ? snap.data() : null);
  }
  return tutorCache.get(tutorId);
}

let written = 0;
for (const doc of bookingsSnap.docs) {
  const booking = { id: doc.id, ...doc.data() };
  const tutor = await getTutor(booking.tutorId);

  await Promise.all(
    (booking.participantStudentIds || []).map((studentId) => {
      const view = {
        id: `${booking.id}_${studentId}`,
        bookingId: booking.id,
        studentId,
        tutorId: booking.tutorId,
        tutorName: tutor?.fullName || null,
        tutorWhatsapp: tutor?.whatsappNumber || null,
        type: booking.type,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        pricePerStudent: booking.pricePerStudent,
        groupSize: booking.type === 'GROUP' ? booking.participants.length : undefined,
        maxGroupSize: booking.type === 'GROUP' ? booking.maxGroupSize : undefined,
      };
      written++;
      return db.collection('bookingViews').doc(view.id).set(view);
    })
  );
}

console.log(`Wrote ${written} bookingViews docs.`);
