import { Firestore } from 'firebase-admin/firestore';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { BookingView } from '@/core/types/bookingView';

// Writes/refreshes the sanitized bookingViews doc for every current participant of a booking —
// called after every Admin SDK write that touches a Booking (create, join, status change) so
// each participant's realtime dashboard mirror stays in sync. Never partial: always regenerated
// from the booking's current participant list, so a student who left/was removed simply stops
// being one of the docs written (existing stale ones are harmless — id-scoped to that student,
// and status differences don't matter once nobody reads a booking they're no longer part of).
export async function syncBookingViews(adminDb: Firestore, booking: Booking, tutor?: Tutor | null): Promise<void> {
  const tutorDoc = tutor !== undefined ? tutor : (await adminDb.collection('tutors').doc(booking.tutorId).get()).data() as Tutor | undefined;

  await Promise.all(
    booking.participantStudentIds.map((studentId) => {
      const view: BookingView = {
        id: `${booking.id}_${studentId}`,
        bookingId: booking.id,
        studentId,
        tutorId: booking.tutorId,
        tutorName: tutorDoc?.fullName || null,
        tutorWhatsapp: tutorDoc?.whatsappNumber || null,
        type: booking.type,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        pricePerStudent: booking.pricePerStudent,
        groupSize: booking.type === 'GROUP' ? booking.participants.length : undefined,
        maxGroupSize: booking.type === 'GROUP' ? booking.maxGroupSize : undefined,
      };
      return adminDb.collection('bookingViews').doc(view.id).set(view);
    })
  );
}
