import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Review } from '@/core/types/review';
import { Student } from '@/core/types/student';
import { Booking } from '@/core/types/booking';

const SESSION_COOKIE_NAME = 'session';

// POST /api/reviews — used only when a real, logged-in student submits a review (the anonymous
// guest path still goes through the direct client-SDK createReview()). Checks for a real
// completed/confirmed booking with this tutor and marks the review "verified" if one exists —
// a trust signal a plain client write could never be allowed to self-report (see
// firestore.rules' isValidReview()).
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tutorId: string | undefined = body?.tutorId;
  const rating: number = Number(body?.rating);
  const comment: string | undefined = body?.comment?.trim();

  if (!tutorId || !comment || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ success: false, error: 'Missing or invalid fields' }, { status: 400 });
  }
  if (comment.length > 2000) {
    return NextResponse.json({ success: false, error: 'Comment is too long' }, { status: 400 });
  }

  const tutorSnap = await adminDb.collection('tutors').doc(tutorId).get();
  if (!tutorSnap.exists) {
    return NextResponse.json({ success: false, error: 'Tutor not found' }, { status: 404 });
  }

  const studentSnap = await adminDb.collection('students').doc(studentId).get();
  const student = studentSnap.exists ? (studentSnap.data() as Student) : null;

  const bookingsSnap = await adminDb
    .collection('bookings')
    .where('tutorId', '==', tutorId)
    .where('participantStudentIds', 'array-contains', studentId)
    .get();
  const verified = bookingsSnap.docs.some((d) => {
    const b = d.data() as Booking;
    return b.status === 'CONFIRMED' || b.status === 'COMPLETED';
  });

  const now = new Date().toISOString();
  const ref = adminDb.collection('reviews').doc();
  const review: Review = {
    id: ref.id,
    tutorId,
    studentId,
    verified,
    reviewerName: student?.fullName || 'Student',
    rating,
    comment,
    status: 'PENDING',
    createdAt: now,
  };
  await ref.set(review);

  return NextResponse.json({ success: true, review });
}
