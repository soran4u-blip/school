import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Job, JobApplication } from '@/core/types/job';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { FieldValue } from 'firebase-admin/firestore';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { jobApplicationSchema } from '@/core/validation/schemas';

// POST /api/job-applications — Admin SDK only now (firestore.rules denies client creates), so an
// applicant is rate-limited by IP rather than relying on freely-mintable anonymous Firebase Auth
// sessions, which had no real abuse protection.
export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const ip = getClientIp(request);
  const rateLimit = await checkRateLimit(adminDb, `job-application:ip:${ip}`, { max: 5, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many applications submitted recently. Please try again later.' }, { status: 429 });
  }

  const parsed = await parseJsonBody(request, jobApplicationSchema);
  if (parsed.error) return parsed.error;
  const { jobId, fullName, phone, email, coverLetter, resumeUrl } = parsed.data;

  const jobSnap = await adminDb.collection('jobs').doc(jobId).get();
  if (!jobSnap.exists) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }
  const job = jobSnap.data() as Job;
  if (job.status !== 'ACTIVE') {
    return NextResponse.json({ success: false, error: 'This job is no longer accepting applications' }, { status: 400 });
  }

  const ref = adminDb.collection('jobApplications').doc();
  const now = new Date().toISOString();
  const application: JobApplication = {
    id: ref.id,
    jobId,
    ...(job.institutionId && { institutionId: job.institutionId }),
    ...(job.employerId && { employerId: job.employerId }),
    jobTitle: job.title,
    fullName,
    phone,
    ...(email && { email }),
    ...(coverLetter && { coverLetter }),
    resumeUrl,
    status: 'SUBMITTED',
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(application);
  // Atomic field increment — no read-modify-write race, and no reason to fail the submission if
  // this denormalized counter update has a transient issue.
  await adminDb.collection('jobs').doc(jobId).update({ applicantCount: FieldValue.increment(1) }).catch(() => {});

  return NextResponse.json({ success: true, application });
}
