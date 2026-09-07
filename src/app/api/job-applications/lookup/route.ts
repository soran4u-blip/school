import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Job, JobApplication } from '@/core/types/job';
import { Institution } from '@/core/types/institution';

// GET /api/job-applications/lookup?phone=... — a guest applicant finds their own applications
// across every job, sanitized (institution name/whatsapp only, no other applicants' data).
export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const snap = await adminDb.collection('jobApplications').where('phone', '==', phone).get();
  const applications = snap.docs.map((d) => d.data() as JobApplication);

  const jobIds = [...new Set(applications.map((a) => a.jobId))];
  const institutionIds = [...new Set(applications.map((a) => a.institutionId))];

  const [jobs, institutions] = await Promise.all([
    Promise.all(jobIds.map(async (id) => {
      const s = await adminDb!.collection('jobs').doc(id).get();
      return s.exists ? (s.data() as Job) : null;
    })),
    Promise.all(institutionIds.map(async (id) => {
      const s = await adminDb!.collection('institutions').doc(id).get();
      return s.exists ? (s.data() as Institution) : null;
    })),
  ]);
  const jobsById = new Map(jobs.filter(Boolean).map((j) => [j!.id, j!]));
  const institutionsById = new Map(institutions.filter(Boolean).map((i) => [i!.id, i!]));

  const result = applications
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => {
      const job = jobsById.get(a.jobId);
      const institution = institutionsById.get(a.institutionId);
      return {
        id: a.id,
        jobId: a.jobId,
        jobTitle: job?.title || a.jobTitle || null,
        institutionId: a.institutionId,
        institutionName: institution?.name || null,
        institutionWhatsapp: institution?.contact?.whatsappNumber || null,
        status: a.status,
        createdAt: a.createdAt,
      };
    });

  return NextResponse.json({ success: true, applications: result });
}
