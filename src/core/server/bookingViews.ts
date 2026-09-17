import { Firestore } from 'firebase-admin/firestore';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { BookingView } from '@/core/types/bookingView';

// Refresh the sanitized student-facing mirror for every current participant.
export async function syncBookingViews(
  adminDb: Firestore,
  booking: Booking,
  tutor?: Tutor | null,
): Promise<void> {
  const tutorDoc =
    tutor !== undefined
      ? tutor
      : ((await adminDb.collection('tutors').doc(booking.tutorId).get()).data() as Tutor | undefined);

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
        ...(booking.type === 'GROUP'
          ? {
              groupSize: booking.participants.length,
              maxGroupSize: booking.maxGroupSize,
            }
          : {}),
      };
      return adminDb.collection('bookingViews').doc(view.id).set(view);
    }),
  );
}
