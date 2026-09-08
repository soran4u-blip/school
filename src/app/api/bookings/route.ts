import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { Student } from '@/core/types/student';
import { dayOfWeekFromDate, addDaysToDateString, isWithinAvailability } from '@/lib/bookingLogic';

const MAX_RECURRING_WEEKS = 12;
const SESSION_COOKIE_NAME = 'session';

export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'You must be signed in as a student to book' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'You must be signed in as a student to book' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'You must be signed in as a student to book' }, { status: 401 });
  }

  const studentSnap = await adminDb.collection('students').doc(studentId).get();
  if (!studentSnap.exists) {
    return NextResponse.json({ success: false, error: 'Student account not found' }, { status: 400 });
  }
  const student = studentSnap.data() as Student;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { tutorId, date, startTime, endTime, type, joinBookingId, subjectId, recurring, weeks } = body;

  if (!tutorId || !date || !startTime || !endTime) {
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
  if ((tutor.unavailableDates || []).includes(date)) {
    return NextResponse.json({ success: false, error: 'Tutor is unavailable on this date' }, { status: 400 });
  }

  const participant = { studentId, name: student.fullName.slice(0, 100), phone: student.phone.slice(0, 30) };

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
        if (booking.participantStudentIds?.includes(studentId)) {
          throw new Error('You have already joined this group');
        }
        if (booking.participants.length >= booking.maxGroupSize) {
          throw new Error('This group is already full');
        }
        const participants = [...booking.participants, participant];
        const participantStudentIds = [...(booking.participantStudentIds || []), studentId];
        const pricePerStudent = {
          iqd: Math.round(tutor.groupRate.iqd / participants.length),
          usd: Math.round(tutor.groupRate.usd / participants.length),
        };
        tx.update(ref, { participants, participantStudentIds, pricePerStudent });
        return { ...booking, participants, participantStudentIds, pricePerStudent };
      });
      return NextResponse.json({ success: true, booking: result });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message || 'Failed to join group' }, { status: 400 });
    }
  }

  // --- Starting a new booking (individual or new group) ---
  const bookingType: 'INDIVIDUAL' | 'GROUP' = type === 'GROUP' ? 'GROUP' : 'INDIVIDUAL';

  async function createBookingOnDate(targetDate: string, recurringGroupId?: string): Promise<Booking> {
    const now = new Date().toISOString();
    const ref = adminDb!.collection('bookings').doc();
    const newBooking: Booking = {
      id: ref.id,
      tutorId,
      type: bookingType,
      ...(subjectId && { subjectId }),
      date: targetDate,
      dayOfWeek,
      startTime,
      endTime,
      maxGroupSize: bookingType === 'GROUP' ? tutor.groupMaxSize || 4 : 1,
      participants: [participant],
      participantStudentIds: [studentId],
      pricePerStudent: bookingType === 'GROUP' ? { ...tutor.groupRate } : { ...tutor.hourlyRate },
      status: 'PENDING',
      createdAt: now,
      ...(recurringGroupId && { recurringGroupId }),
    };
    await ref.set(newBooking);
    return newBooking;
  }

  async function hasConflict(targetDate: string): Promise<boolean> {
    const conflictSnap = await adminDb!
      .collection('bookings')
      .where('tutorId', '==', tutorId)
      .where('date', '==', targetDate)
      .where('startTime', '==', startTime)
      .get();
    return conflictSnap.docs.some((d) => {
      const b = d.data() as Booking;
      return b.status !== 'CANCELLED' && (b.type === 'INDIVIDUAL' || bookingType === 'INDIVIDUAL');
    });
  }

  // Recurring weekly bookings — individual sessions only (a repeating group booking would need
  // per-week participant/price tracking that's a much bigger feature; scope this to the common
  // case of a student locking in a standing weekly slot with their tutor).
  if (recurring && bookingType === 'INDIVIDUAL') {
    const weekCount = Math.min(Math.max(Number(weeks) || 1, 1), MAX_RECURRING_WEEKS);
    const recurringGroupId = adminDb.collection('bookings').doc().id;
    const created: Booking[] = [];
    const skipped: { date: string; reason: string }[] = [];

    for (let i = 0; i < weekCount; i++) {
      const targetDate = addDaysToDateString(date, i * 7);
      if ((tutor.unavailableDates || []).includes(targetDate)) {
        skipped.push({ date: targetDate, reason: 'unavailable' });
        continue;
      }
      if (await hasConflict(targetDate)) {
        skipped.push({ date: targetDate, reason: 'conflict' });
        continue;
      }
      created.push(await createBookingOnDate(targetDate, recurringGroupId));
    }

    if (created.length === 0) {
      return NextResponse.json({ success: false, error: 'No sessions could be booked in that weekly range' }, { status: 409 });
    }
    return NextResponse.json({ success: true, booking: created[0], bookings: created, skipped, recurringGroupId });
  }

  if (await hasConflict(date)) {
    return NextResponse.json({ success: false, error: 'This time slot is no longer available' }, { status: 409 });
  }

  const newBooking = await createBookingOnDate(date);
  return NextResponse.json({ success: true, booking: newBooking });
}
