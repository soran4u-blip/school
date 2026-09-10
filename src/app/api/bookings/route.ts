import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Booking } from '@/core/types/booking';
import { Tutor } from '@/core/types/tutor';
import { Student } from '@/core/types/student';
import { dayOfWeekFromDate, addDaysToDateString, isWithinAvailability } from '@/lib/bookingLogic';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { bookingSchema } from '@/core/validation/schemas';
import { errorMessage } from '@/lib/errors';
import { syncBookingViews } from '@/core/server/bookingViews';
import { sendPushToTutor } from '@/core/server/push';

const MAX_RECURRING_WEEKS = 12;

export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'You must be signed in as a student to book' }, { status: 401 });
  }
  const studentId = user.uid;

  const studentSnap = await adminDb.collection('students').doc(studentId).get();
  if (!studentSnap.exists) {
    return NextResponse.json({ success: false, error: 'Student account not found' }, { status: 400 });
  }
  const student = studentSnap.data() as Student;

  const parsed = await parseJsonBody(request, bookingSchema);
  if (parsed.error) return parsed.error;
  const { tutorId, date, startTime, endTime, type, joinBookingId, subjectId, recurring, weeks } = parsed.data;

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

      await syncBookingViews(adminDb, result, tutor);
      // Keep a thread the new participant may not have been part of when it was created in sync,
      // so they can read past messages immediately rather than waiting for the next new one.
      const threadRef = adminDb.collection('threads').doc(joinBookingId);
      const threadSnap = await threadRef.get();
      if (threadSnap.exists) {
        await threadRef.update({ participantStudentIds: result.participantStudentIds });
      }
      await sendPushToTutor(adminDb, tutorId, {
        title: 'A student joined your group session',
        body: `${student.fullName} joined your ${date} ${startTime} group session.`,
        url: '/tutor/dashboard?tab=bookings',
      }).catch(() => {});

      return NextResponse.json({ success: true, booking: result });
    } catch (e: unknown) {
      return NextResponse.json({ success: false, error: errorMessage(e, 'Failed to join group') }, { status: 400 });
    }
  }

  // --- Starting a new booking (individual or new group) ---
  const bookingType: 'INDIVIDUAL' | 'GROUP' = type === 'GROUP' ? 'GROUP' : 'INDIVIDUAL';

  function buildBooking(targetDate: string, recurringGroupId?: string): Booking {
    const now = new Date().toISOString();
    const ref = adminDb!.collection('bookings').doc();
    return {
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
  }

  // Firestore transactions serialize on their query reads: if a conflicting booking is written
  // between this query and the commit, the transaction aborts and retries. That closes the
  // check-then-create race that a plain get()-then-set() would leave open for concurrent requests
  // hitting the same tutor/date/startTime slot.
  async function createIfNoConflict(targetDate: string, recurringGroupId?: string): Promise<Booking | null> {
    const conflictQuery = adminDb!
      .collection('bookings')
      .where('tutorId', '==', tutorId)
      .where('date', '==', targetDate)
      .where('startTime', '==', startTime);

    return adminDb!.runTransaction(async (tx) => {
      const conflictSnap = await tx.get(conflictQuery);
      const conflict = conflictSnap.docs.some((d) => {
        const b = d.data() as Booking;
        return b.status !== 'CANCELLED' && (b.type === 'INDIVIDUAL' || bookingType === 'INDIVIDUAL');
      });
      if (conflict) return null;

      const newBooking = buildBooking(targetDate, recurringGroupId);
      tx.set(adminDb!.collection('bookings').doc(newBooking.id), newBooking);
      return newBooking;
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
      const booking = await createIfNoConflict(targetDate, recurringGroupId);
      if (!booking) {
        skipped.push({ date: targetDate, reason: 'conflict' });
        continue;
      }
      created.push(booking);
    }

    if (created.length === 0) {
      return NextResponse.json({ success: false, error: 'No sessions could be booked in that weekly range' }, { status: 409 });
    }
    await Promise.all(created.map((b) => syncBookingViews(adminDb!, b, tutor)));
    await sendPushToTutor(adminDb, tutorId, {
      title: 'New recurring booking request',
      body: `${student.fullName} requested a weekly session starting ${date} at ${startTime}.`,
      url: '/tutor/dashboard?tab=bookings',
    }).catch(() => {});
    return NextResponse.json({ success: true, booking: created[0], bookings: created, skipped, recurringGroupId });
  }

  const newBooking = await createIfNoConflict(date);
  if (!newBooking) {
    return NextResponse.json({ success: false, error: 'This time slot is no longer available' }, { status: 409 });
  }
  await syncBookingViews(adminDb, newBooking, tutor);
  await sendPushToTutor(adminDb, tutorId, {
    title: 'New booking request',
    body: `${student.fullName} requested a session on ${newBooking.date} at ${newBooking.startTime}.`,
    url: '/tutor/dashboard?tab=bookings',
  }).catch(() => {});
  return NextResponse.json({ success: true, booking: newBooking });
}
