import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Job, JobApplication } from '@/core/types/job';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';
import { FieldValue } from 'firebase-admin/firestore';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { jobApplicationSchema } from '@/core/validation/schemas';
import { dispatchNotification, resolveOwnerRecipient } from '@/core/server/notifications';
import { getSessionUser } from '@/core/server/session';

// POST /api/job-applications — Admin SDK only now (firestore.rules denies client creates), so an
// applicant is rate-limited by IP rather than relying on freely-mintable anonymous Firebase Auth
// sessions, which had no real abuse protection. Applying stays guest-friendly (no auth required),
// but when the applicant does have a student session we record studentId on the application so it
// shows up in /api/account/job-applications — the response's application.id doubles as their
// confirmation reference either way.
export async function POST(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionUser = await getSessionUser(request);
  const studentId = sessionUser?.role === 'student' ? sessionUser.uid : undefined;

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
    ...(studentId && { studentId }),
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

  // A job posting's owner is exactly one of an institution or an employer; neither was told about
  // new applicants before, so the only way to notice one was to open the dashboard and look.
  const ownerCollection = job.institutionId ? 'institutions' : 'employers';
  const ownerDirectoryId = job.institutionId || job.employerId;
  if (ownerDirectoryId) {
    const owner = await resolveOwnerRecipient(adminDb, ownerCollection, ownerDirectoryId).catch(() => null);
    if (owner) {
      await dispatchNotification(adminDb, {
        ...owner,
        recipientRole: job.institutionId ? 'institution' : 'employer',
        type: 'JOB_APPLICATION',
        title: { ar: 'طلب توظيف جديد', en: 'New job application' },
        body: {
          ar: `${fullName} تقدّم لوظيفة ${job.title.ar || job.title.en}`,
          en: `${fullName} applied for ${job.title.en || job.title.ar}`,
        },
        linkUrl: `${job.institutionId ? '/institution' : '/employer'}/dashboard/jobs/${jobId}`,
        metadata: { applicationId: ref.id, jobId, applicantName: fullName },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, application });
}
