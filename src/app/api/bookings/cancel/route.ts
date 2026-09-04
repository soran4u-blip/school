import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const { bookingId, phone } = body || {};
  if (!bookingId || !phone?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const ref = adminDb.collection('bookings').doc(bookingId);

  try {
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Booking not found');
      const booking = snap.data() as Booking;

      if (!booking.participantPhones?.includes(phone.trim())) {
        throw new Error('This booking does not belong to that phone number');
      }
      if (booking.status === 'CANCELLED') {
        throw new Error('Booking is already cancelled');
      }

      if (booking.participants.length <= 1) {
        tx.update(ref, { status: 'CANCELLED' });
        return;
      }

      // Group booking with other students still in it — remove just this participant
      // and recompute the split price for whoever remains.
      const tutorSnap = await tx.get(adminDb!.collection('tutors').doc(booking.tutorId));
      const tutor = tutorSnap.data() as Tutor;
      const participants = booking.participants.filter((p) => p.phone !== phone.trim());
      const participantPhones = booking.participantPhones.filter((p) => p !== phone.trim());
      const pricePerStudent = {
        iqd: Math.round(tutor.groupRate.iqd / participants.length),
        usd: Math.round(tutor.groupRate.usd / participants.length),
      };
      tx.update(ref, { participants, participantPhones, pricePerStudent });
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to cancel booking' }, { status: 400 });
  }
}
