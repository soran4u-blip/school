import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { getSessionUser } from '@/core/server/session';
import { JobApplication } from '@/core/types/job';
import { Institution } from '@/core/types/institution';
import { Employer } from '@/core/types/employer';

// GET /api/account/job-applications — a logged-in student's own job applications, looked up by
// uid (attached at submission time, see /api/job-applications) with a fallback match on the
// phone on their account (custom claim), for applications submitted before that uid was
// recorded — same pattern as /api/account/inquiries.
export async function GET(request: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const user = await getSessionUser(request);
  if (user?.role !== 'student') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [byStudentId, byPhone] = await Promise.all([
      adminDb.collection('jobApplications').where('studentId', '==', user.uid).get(),
      user.phone ? adminDb.collection('jobApplications').where('phone', '==', user.phone).get() : null,
    ]);
    const docsById = new Map<string, JobApplication>();
    for (const d of byStudentId.docs) docsById.set(d.id, d.data() as JobApplication);
    for (const d of byPhone?.docs || []) docsById.set(d.id, d.data() as JobApplication);

    const institutionIds = [...new Set([...docsById.values()].map((a) => a.institutionId).filter((v): v is string => !!v))];
    const employerIds = [...new Set([...docsById.values()].map((a) => a.employerId).filter((v): v is string => !!v))];
    const institutions = new Map<string, Institution>();
    const employers = new Map<string, Employer>();
    await Promise.all([
      ...institutionIds.map(async (id) => {
        const s = await adminDb!.collection('institutions').doc(id).get();
        if (s.exists) institutions.set(id, s.data() as Institution);
      }),
      ...employerIds.map(async (id) => {
        const s = await adminDb!.collection('employers').doc(id).get();
        if (s.exists) employers.set(id, s.data() as Employer);
      }),
    ]);

    const applications = [...docsById.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => {
        const institution = a.institutionId ? institutions.get(a.institutionId) : undefined;
        const employer = a.employerId ? employers.get(a.employerId) : undefined;
        return {
          id: a.id,
          jobId: a.jobId,
          jobTitle: a.jobTitle || null,
          institutionId: a.institutionId || null,
          institutionName: institution?.name || (employer ? { ar: employer.name, en: employer.name } : null),
          institutionWhatsapp: institution?.contact?.whatsappNumber || employer?.contact?.whatsappNumber || null,
          status: a.status,
          createdAt: a.createdAt,
        };
      });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Account job applications lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
}
