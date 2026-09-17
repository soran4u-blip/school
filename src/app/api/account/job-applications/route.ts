import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { Job, JobApplication } from '@/core/types/job';

// GET /api/account/job-applications — a logged-in student's own job applications, looked up by
// their account uid (verified server-side from the session), same pattern as
// /api/account/admission-applications. Only applications submitted while signed in carry a
// studentId, so a guest application made before login won't appear here — use
// /api/job-applications/lookup?phone=... for that case.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await adminDb.collection('jobApplications').where('studentId', '==', user.uid).get();
    const jobIds = [...new Set(snap.docs.map((d) => (d.data() as JobApplication).jobId))];
    const jobs = new Map<string, Job>();
    await Promise.all(
      jobIds.map(async (id) => {
        const job = await adminDb!.collection('jobs').doc(id).get();
        if (job.exists) jobs.set(id, job.data() as Job);
      })
    );

    const applications = snap.docs
      .map((d) => d.data() as JobApplication)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((app) => {
        const job = jobs.get(app.jobId);
        return {
          id: app.id,
          jobId: app.jobId,
          jobTitle: job?.title || app.jobTitle || null,
          jobSlug: job?.slug || null,
          status: app.status,
          createdAt: app.createdAt,
        };
      });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Account job applications lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
