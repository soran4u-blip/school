import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';

function dayOfWeekFromDate(dateStr: string): number {
  // Treat "YYYY-MM-DD" as a plain calendar date, not a timezone-sensitive instant —
  // parsing it as local time (or as `Z`/UTC-instant then reading local fields) can
  // give a different weekday than the client intended depending on server timezone.
  // Date.UTC + getUTCDay reads back exactly the same field we wrote in.
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isWithinAvailability(tutor: Tutor, dayOfWeek: number, startTime: string, endTime: string): boolean {
  return (tutor.availability || []).some(
    (slot) => slot.dayOfWeek === dayOfWeek && startTime >= slot.startTime && endTime <= slot.endTime
  );
}

export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { tutorId, date, startTime, endTime, type, name, phone, joinBookingId, subjectId } = body;

  if (!tutorId || !date || !startTime || !endTime || !name?.trim() || !phone?.trim()) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 });
  }
  if (new Date(`${date}T00:00:00`) < new Date(new Date().toDateString())) {
    return NextResponse.json({ success: false, error: 'Cannot book a past date' }, { status: 400 });
  }

  const tutorSnap = await adminDb.collection('tutors').doc(tutorId).get();
  if (!tutorSnap.exists) {
    return NextResponse.json({ success: false, error: 'Tutor not found' }, { status: 404 });
  }
  const tutor = tutorSnap.data() as Tutor;
  if (tutor.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, error: 'Tutor is not currently accepting bookings' }, { status: 400 });
  }

  const dayOfWeek = dayOfWeekFromDate(date);
  if (!isWithinAvailability(tutor, dayOfWeek, startTime, endTime)) {
    return NextResponse.json({ success: false, error: 'Selected time is outside tutor availability' }, { status: 400 });
  }

  const participant = { name: name.trim().slice(0, 100), phone: phone.trim().slice(0, 30) };

  // --- Joining an existing open group ---
  if (joinBookingId) {
    const ref = adminDb.collection('bookings').doc(joinBookingId);
    try {
      const result = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error('Group booking not found');
        const booking = snap.data() as Booking;
        if (booking.tutorId !== tutorId || booking.type !== 'GROUP' || booking.status === 'CANCELLED') {
          throw new Error('This group is no longer available');
        }
        if (booking.date !== date || booking.startTime !== startTime) {
          throw new Error('Group slot mismatch');
        }
        if (booking.participants.length >= booking.maxGroupSize) {
          throw new Error('This group is already full');
        }
        const participants = [...booking.participants, participant];
        const participantPhones = [...(booking.participantPhones || []), participant.phone];
        const pricePerStudent = {
          iqd: Math.round(tutor.groupRate.iqd / participants.length),
          usd: Math.round(tutor.groupRate.usd / participants.length),
        };
        tx.update(ref, { participants, participantPhones, pricePerStudent });
        return { ...booking, participants, participantPhones, pricePerStudent };
      });
      return NextResponse.json({ success: true, booking: result });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to join group' }, { status: 400 });
    }
  }

  // --- Starting a new booking (individual or new group) ---
  const bookingType: 'INDIVIDUAL' | 'GROUP' = type === 'GROUP' ? 'GROUP' : 'INDIVIDUAL';

  const conflictSnap = await adminDb
    .collection('bookings')
    .where('tutorId', '==', tutorId)
    .where('date', '==', date)
    .where('startTime', '==', startTime)
    .get();

  const hasIndividualConflict = conflictSnap.docs.some((d) => {
    const b = d.data() as Booking;
    return b.status !== 'CANCELLED' && (b.type === 'INDIVIDUAL' || bookingType === 'INDIVIDUAL');
  });
  if (hasIndividualConflict) {
    return NextResponse.json({ success: false, error: 'This time slot is no longer available' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const ref = adminDb.collection('bookings').doc();
  const newBooking: Booking = {
    id: ref.id,
    tutorId,
    type: bookingType,
    ...(subjectId && { subjectId }),
    date,
    dayOfWeek,
    startTime,
    endTime,
    maxGroupSize: bookingType === 'GROUP' ? tutor.groupMaxSize || 4 : 1,
    participants: [participant],
    participantPhones: [participant.phone],
    pricePerStudent: bookingType === 'GROUP' ? { ...tutor.groupRate } : { ...tutor.hourlyRate },
    status: 'PENDING',
    createdAt: now,
  };
  await ref.set(newBooking);

  return NextResponse.json({ success: true, booking: newBooking });
}
