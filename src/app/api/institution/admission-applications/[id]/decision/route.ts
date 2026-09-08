import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { AdmissionApplication, AdmissionApplicationStatus } from '@/core/types/admission';
import { Institution } from '@/core/types/institution';

const SESSION_COOKIE_NAME = 'session';
const VALID_STATUSES: AdmissionApplicationStatus[] = ['UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED'];

// POST /api/institution/admission-applications/[id]/decision — the owning institution moves an
// application to a new status. Runs as a transaction because accepting an applicant has to
// atomically check the program's capacity and increment its denormalized acceptedCount — a bare
// client-side updateDoc under Firestore rules can't safely enforce that against concurrent
// decisions the way a JobApplication's simple status field can.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let institutionId: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== 'institution' || !decoded.institutionId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    institutionId = decoded.institutionId as string;
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const status: AdmissionApplicationStatus | undefined = body?.status;
  const decisionNote: string | undefined = body?.decisionNote?.trim();

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
  }

  const { id } = await params;
  const appRef = adminDb.collection('admissionApplications').doc(id);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const appSnap = await tx.get(appRef);
      if (!appSnap.exists) throw new Error('Application not found');
      const application = appSnap.data() as AdmissionApplication;

      if (application.institutionId !== institutionId) {
        throw new Error('This application does not belong to your institution');
      }
      if (application.status === 'WITHDRAWN') {
        throw new Error('This application was withdrawn by the student and can no longer be decided');
      }

      const wasAccepted = application.status === 'ACCEPTED';
      const becomingAccepted = status === 'ACCEPTED';

      if (wasAccepted !== becomingAccepted) {
        const instRef = adminDb!.collection('institutions').doc(institutionId);
        const instSnap = await tx.get(instRef);
        if (!instSnap.exists) throw new Error('Institution not found');
        const institution = instSnap.data() as Institution;
        const programIndex = (institution.programs || []).findIndex((p) => p.id === application.programId);
        if (programIndex === -1) throw new Error('Program not found');
        const program = institution.programs![programIndex];

        if (becomingAccepted && program.capacity != null && (program.acceptedCount || 0) >= program.capacity) {
          throw new Error('This program has no remaining seats');
        }

        const programs = [...institution.programs!];
        programs[programIndex] = {
          ...program,
          acceptedCount: Math.max(0, (program.acceptedCount || 0) + (becomingAccepted ? 1 : -1)),
        };
        tx.update(instRef, { programs });
      }

      const now = new Date().toISOString();
      const isFinal = status === 'ACCEPTED' || status === 'REJECTED' || status === 'WAITLISTED';
      const update: Partial<AdmissionApplication> = {
        status,
        updatedAt: now,
        ...(decisionNote !== undefined && { decisionNote: decisionNote.slice(0, 2000) }),
        ...(isFinal && { decidedAt: now }),
      };
      tx.update(appRef, update);
      return { ...application, ...update };
    });

    return NextResponse.json({ success: true, application: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || 'Failed to update application' }, { status: 400 });
  }
}
