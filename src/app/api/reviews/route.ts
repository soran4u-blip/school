import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Review } from '@/core/types/review';
import { Student } from '@/core/types/student';
import { Booking } from '@/core/types/booking';
import { AdmissionApplication } from '@/core/types/admission';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { reviewSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';

// POST /api/reviews — the sole path for creating a review now (firestore.rules denies client
// creates entirely; see isValidReview()'s comment). Two identities are handled:
//   - a real, logged-in student: rate-limited by uid, checked for real proof of interaction and
//     marked "verified" if found (a CONFIRMED/COMPLETED booking for a tutor review, an ACCEPTED
//     admission application for an institution review) — a trust signal a plain client write
//     could never self-report.
//   - a guest (no session): rate-limited by IP instead, reviewerName taken from the request body,
//     never verified. This replaces the old anonymous-Firebase-Auth guest path, which had no
//     real rate limiting (an attacker can mint anonymous auth sessions freely).
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let studentId: string | null = null;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      if (decoded.role === 'student') {
        studentId = decoded.uid;
      }
    } catch {
      // Invalid/expired session cookie — fall through and treat as a guest.
    }
  }

  const rateLimitKey = studentId ? `review:student:${studentId}` : `review:ip:${getClientIp(request)}`;
  const rateLimit = await checkRateLimit(adminDb, rateLimitKey, { max: 5, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many reviews submitted recently. Please try again later.' }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, reviewSchema);
  if (parsed.error) return parsed.error;
  const { tutorId, institutionId, rating, comment, reviewerName: guestReviewerName } = parsed.data;

  if (!studentId && !guestReviewerName) {
    return NextResponse.json({ success: false, error: 'Missing or invalid reviewer name' }, { status: 400 });
  }

  const student = studentId ? (await adminDb.collection('students').doc(studentId).get()).data() as Student | undefined : undefined;

  let verified = false;

  if (tutorId) {
    const tutorSnap = await adminDb.collection('tutors').doc(tutorId).get();
    if (!tutorSnap.exists) {
      return NextResponse.json({ success: false, error: 'Tutor not found' }, { status: 404 });
    }
    if (studentId) {
      const bookingsSnap = await adminDb
        .collection('bookings')
        .where('tutorId', '==', tutorId)
        .where('participantStudentIds', 'array-contains', studentId)
        .get();
      verified = bookingsSnap.docs.some((d) => {
        const b = d.data() as Booking;
        return b.status === 'CONFIRMED' || b.status === 'COMPLETED';
      });
    }
  } else {
    const instSnap = await adminDb.collection('institutions').doc(institutionId!).get();
    if (!instSnap.exists) {
      return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
    }
    if (studentId) {
      const applicationsSnap = await adminDb
        .collection('admissionApplications')
        .where('institutionId', '==', institutionId)
        .where('studentId', '==', studentId)
        .get();
      verified = applicationsSnap.docs.some((d) => (d.data() as AdmissionApplication).status === 'ACCEPTED');
    }
  }

  const now = new Date().toISOString();
  const ref = adminDb.collection('reviews').doc();
  const review: Review = {
    id: ref.id,
    ...(tutorId ? { tutorId } : { institutionId }),
    ...(studentId && { studentId }),
    verified,
    reviewerName: studentId ? student?.fullName || 'Student' : guestReviewerName!,
    rating,
    comment,
    status: 'PENDING',
    createdAt: now,
  };
  await ref.set(review);

  return NextResponse.json({ success: true, review });
}
