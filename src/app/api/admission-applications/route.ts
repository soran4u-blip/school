import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { AdmissionApplication } from '@/core/types/admission';
import { Institution } from '@/core/types/institution';
import { Student } from '@/core/types/student';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { admissionApplicationSchema } from '@/core/validation/schemas';

const SESSION_COOKIE_NAME = 'session';
// Statuses that count as "already in progress" for a student re-applying to the same program.
const ACTIVE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'WAITLISTED', 'ACCEPTED'];

// POST /api/admission-applications — a logged-in student applies to an institution program.
// Identity (studentId/name/phone/email) is derived server-side from the student's own account,
// never trusted from the request body — same posture as /api/bookings.
export async function POST(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'You must be signed in as a student to apply' }, { status: 401 });
  }

  let studentId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'You must be signed in as a student to apply' }, { status: 401 });
    }
    studentId = decoded.uid;
  } catch {
    return NextResponse.json({ success: false, error: 'You must be signed in as a student to apply' }, { status: 401 });
  }

  const studentSnap = await adminDb.collection('students').doc(studentId).get();
  if (!studentSnap.exists) {
    return NextResponse.json({ success: false, error: 'Student account not found' }, { status: 400 });
  }
  const student = studentSnap.data() as Student;

  const parsed = await parseJsonBody(request, admissionApplicationSchema);
  if (parsed.error) return parsed.error;
  const { institutionId, programId, message, documentUrls } = parsed.data;

  const instSnap = await adminDb.collection('institutions').doc(institutionId).get();
  if (!instSnap.exists) {
    return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
  }
  const institution = instSnap.data() as Institution;
  if (institution.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, error: 'This institution is not currently accepting applications' }, { status: 400 });
  }

  const program = (institution.programs || []).find((p) => p.id === programId);
  if (!program || !program.isActive) {
    return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
  }
  if (program.isAcceptingApplications === false) {
    return NextResponse.json({ success: false, error: 'This program is not currently accepting applications' }, { status: 400 });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (program.applicationDeadline && program.applicationDeadline < today) {
    return NextResponse.json({ success: false, error: 'The application deadline for this program has passed' }, { status: 400 });
  }

  const existingSnap = await adminDb
    .collection('admissionApplications')
    .where('studentId', '==', studentId)
    .where('programId', '==', programId)
    .get();
  const hasActive = existingSnap.docs.some((d) => ACTIVE_STATUSES.includes((d.data() as AdmissionApplication).status));
  if (hasActive) {
    return NextResponse.json({ success: false, error: 'You have already applied to this program' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const ref = adminDb.collection('admissionApplications').doc();
  const application: AdmissionApplication = {
    id: ref.id,
    institutionId,
    programId,
    programName: program.name,
    studentId,
    studentName: student.fullName,
    studentPhone: student.phone,
    studentEmail: student.email,
    ...(message && { message: message.slice(0, 3000) }),
    ...(documentUrls && documentUrls.length > 0 && { documentUrls }),
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(application);

  return NextResponse.json({ success: true, application });
}
