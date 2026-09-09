import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Job, JobApplication } from '@/core/types/job';
import { Institution } from '@/core/types/institution';
import { Employer } from '@/core/types/employer';
import { checkRateLimit, getClientIp } from '@/core/server/rateLimit';

// GET /api/job-applications/lookup?phone=... — a guest applicant finds their own applications
// across every job, sanitized (poster name/whatsapp only, no other applicants' data).
// Rate-limited by IP for the same reason as /api/inquiries/lookup — phone is the only credential
// and this is a real PII lookup.
export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const rateLimit = await checkRateLimit(adminDb, `job-application-lookup:ip:${getClientIp(request)}`, { max: 10, windowMinutes: 60 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const snap = await adminDb.collection('jobApplications').where('phone', '==', phone).get();
  const applications = snap.docs.map((d) => d.data() as JobApplication);

  const jobIds = [...new Set(applications.map((a) => a.jobId))];
  const institutionIds = [...new Set(applications.map((a) => a.institutionId).filter((v): v is string => !!v))];
  const employerIds = [...new Set(applications.map((a) => a.employerId).filter((v): v is string => !!v))];

  const [jobs, institutions, employers] = await Promise.all([
    Promise.all(jobIds.map(async (id) => {
      const s = await adminDb!.collection('jobs').doc(id).get();
      return s.exists ? (s.data() as Job) : null;
    })),
    Promise.all(institutionIds.map(async (id) => {
      const s = await adminDb!.collection('institutions').doc(id).get();
      return s.exists ? (s.data() as Institution) : null;
    })),
    Promise.all(employerIds.map(async (id) => {
      const s = await adminDb!.collection('employers').doc(id).get();
      return s.exists ? (s.data() as Employer) : null;
    })),
  ]);
  const jobsById = new Map(jobs.filter(Boolean).map((j) => [j!.id, j!]));
  const institutionsById = new Map(institutions.filter(Boolean).map((i) => [i!.id, i!]));
  const employersById = new Map(employers.filter(Boolean).map((e) => [e!.id, e!]));

  const result = applications
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => {
      const job = jobsById.get(a.jobId);
      const institution = a.institutionId ? institutionsById.get(a.institutionId) : undefined;
      const employer = a.employerId ? employersById.get(a.employerId) : undefined;
      return {
        id: a.id,
        jobId: a.jobId,
        jobTitle: job?.title || a.jobTitle || null,
        institutionId: a.institutionId || null,
        institutionName: institution?.name || (employer ? { ar: employer.name, en: employer.name } : null),
        institutionWhatsapp: institution?.contact?.whatsappNumber || employer?.contact?.whatsappNumber || null,
        status: a.status,
        createdAt: a.createdAt,
      };
    });

  return NextResponse.json({ success: true, applications: result });
}
