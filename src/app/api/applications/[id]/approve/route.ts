import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import { Application } from '@/core/types/application';
import { Tutor } from '@/core/types/tutor';
import { Institution } from '@/core/types/institution';
import { Employer } from '@/core/types/employer';
import { slugify } from '@/lib/slug';
import { logServerError } from '@/core/server/errorLog';
import { recordAuditEvent } from '@/core/server/auditLog';
import { requirePermission } from '@/core/server/session';
import { UserRecord } from 'firebase-admin/auth';
import { errorCode, errorMessage, errorStack } from '@/lib/errors';

function randomPassword(): string {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
}

// Claims the application for approval inside a transaction so two concurrent requests (a
// doubled-click, a retried request) can't both pass the PENDING check and each create their own
// Auth user + profile for the same applicant. APPROVING is left in place (not reset to PENDING)
// on failure, so a retry resumes rather than re-claiming from scratch — see resumeOrCreateAuthUser.
async function claimApplication(id: string): Promise<Application> {
  const ref = adminDb!.collection('applications').doc(id);
  return adminDb!.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('NOT_FOUND');
    const application = snap.data() as Application;
    if (application.status === 'APPROVED') throw new Error('ALREADY_APPROVED');
    if (application.status === 'REJECTED') throw new Error('ALREADY_REVIEWED');
    if (application.status === 'PENDING') {
      tx.update(ref, { status: 'APPROVING' });
    }
    return application;
  });
}

// Gets or creates the applicant's Auth user, idempotently:
// - If a prior attempt already created the user (recorded as pendingAuthUid), reuse it.
// - Otherwise create it, and if the email is already registered, only adopt that existing user
//   if it has no role claim yet (an orphan from a prior attempt that crashed after createUser but
//   before pendingAuthUid was persisted) — an account that already has a role is a genuine
//   conflict, not something safe to silently take over.
async function resumeOrCreateAuthUser(
  applicationId: string,
  pendingAuthUid: string | undefined,
  email: string,
  fullName: string
): Promise<UserRecord> {
  if (pendingAuthUid) {
    return adminAuth!.getUser(pendingAuthUid);
  }

  let authUser: UserRecord;
  try {
    authUser = await adminAuth!.createUser({ email, password: randomPassword(), displayName: fullName });
  } catch (error: unknown) {
    if (errorCode(error) !== 'auth/email-already-exists') throw error;
    const existing = await adminAuth!.getUserByEmail(email);
    if (existing.customClaims?.role) {
      throw error; // genuine conflict — this email already belongs to an active account
    }
    authUser = existing;
  }

  await adminDb!.collection('applications').doc(applicationId).update({ pendingAuthUid: authUser.uid });
  return authUser;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // proxy.ts already gates /api/applications, but this route provisions a real login and hands
  // back a password-reset link — not something to leave depending on a matcher entry staying
  // correct.
  const auth = await requirePermission(request, 'applications:write');
  if (auth.error) return auth.error;
  const actor = auth.context.user;

  if (!adminDb || !adminAuth) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const { id } = await params;

  let application: Application;

  try {
    application = await claimApplication(id);
  } catch (error: unknown) {
    if (errorMessage(error) === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: 'Application already reviewed' }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    const authUser = await resumeOrCreateAuthUser(id, application.pendingAuthUid, application.email, application.fullName);
    // Deterministic, auth-uid-based profile id: a retry after a partial failure re-derives the
    // same id and re-sets (merge) the same profile instead of creating a second one.

    if (application.type === 'INSTITUTION') {
      await adminAuth.setCustomUserClaims(authUser.uid, { role: 'institution', institutionId: authUser.uid });
      const instRef = adminDb.collection('institutions').doc(authUser.uid);
      const institution: Institution = {
        id: authUser.uid,
        userId: authUser.uid,
        slug: slugify(application.fullName, authUser.uid.slice(-6), 'institution'),
        name: { ar: application.fullName, en: application.fullName },
        categoryId: application.categoryId || '',
        governorateId: application.governorateId,
        logoUrl: '',
        coverImageUrl: '',
        tagline: { ar: '', en: '' },
        description: { ar: application.message, en: application.message },
        address: { ar: '', en: '' },
        contact: {
          phonePrimary: application.phone,
          whatsappNumber: application.whatsappNumber || application.phone,
          email: application.email,
        },
        establishedYear: new Date().getFullYear(),
        genderPolicy: 'CO_ED',
        languagesOfInstruction: ['AR'],
        tuition: { min: 0, max: 0, currency: 'USD', period: 'YEAR' },
        taxonomyIds: [],
        isVerified: false,
        verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
        status: 'PENDING',
        isFeatured: false,
        metrics: { ratingAvg: 0, reviewCount: 0 },
        createdAt: now,
        updatedAt: now,
      };
      await instRef.set(institution, { merge: true });

      const resetLink = await adminAuth.generatePasswordResetLink(application.email);
      await adminDb.collection('applications').doc(id).update({ status: 'APPROVED', reviewedAt: now, resultInstitutionId: authUser.uid });
      await recordAuditEvent(adminDb, {
        actor: actor,
        action: 'application.approve',
        targetType: 'application',
        targetId: id,
        summary: `Approved ${application.type.toLowerCase()} application for "${application.fullName}"`,
        metadata: { provisionedUid: authUser.uid, email: application.email },
        request,
      });
      return NextResponse.json({ success: true, institutionId: authUser.uid, resetLink });
    }

    if (application.type === 'EMPLOYER') {
      await adminAuth.setCustomUserClaims(authUser.uid, { role: 'employer', employerId: authUser.uid });
      const employerRef = adminDb.collection('employers').doc(authUser.uid);
      const employer: Employer = {
        id: authUser.uid,
        userId: authUser.uid,
        name: application.fullName,
        type: application.employerType || 'COMPANY',
        description: application.message,
        governorateId: application.governorateId,
        contact: {
          phone: application.phone,
          whatsappNumber: application.whatsappNumber || application.phone,
          email: application.email,
        },
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      };
      await employerRef.set(employer, { merge: true });

      const resetLink = await adminAuth.generatePasswordResetLink(application.email);
      await adminDb.collection('applications').doc(id).update({ status: 'APPROVED', reviewedAt: now, resultEmployerId: authUser.uid });
      await recordAuditEvent(adminDb, {
        actor: actor,
        action: 'application.approve',
        targetType: 'application',
        targetId: id,
        summary: `Approved ${application.type.toLowerCase()} application for "${application.fullName}"`,
        metadata: { provisionedUid: authUser.uid, email: application.email },
        request,
      });
      return NextResponse.json({ success: true, employerId: authUser.uid, resetLink });
    }

    await adminAuth.setCustomUserClaims(authUser.uid, { role: 'tutor', tutorId: authUser.uid });
    const tutorRef = adminDb.collection('tutors').doc(authUser.uid);
    const tutor: Tutor = {
      id: authUser.uid,
      userId: authUser.uid,
      slug: slugify(application.fullName, authUser.uid.slice(-6), 'tutor'),
      fullName: { ar: application.fullName, en: application.fullName },
      title: { ar: '', en: '' },
      bio: { ar: application.message, en: application.message },
      photoUrl: '',
      governorateId: application.governorateId,
      hourlyRate: { iqd: 0, usd: 0 },
      groupRate: { iqd: 0, usd: 0 },
      groupMaxSize: 4,
      availability: [],
      deliveryMode: ['IN_PERSON'],
      subjectIds: application.subjectIds || [],
      studentLevelIds: application.studentLevelIds || [],
      whatsappNumber: application.whatsappNumber || application.phone,
      phone: application.phone,
      yearsOfExperience: application.yearsOfExperience || 0,
      isVerified: false,
      verificationBadgeLabel: { ar: 'قيد المراجعة', en: 'Under Review' },
      status: 'PENDING',
      ratingAvg: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await tutorRef.set(tutor, { merge: true });

    const resetLink = await adminAuth.generatePasswordResetLink(application.email);
    await adminDb.collection('applications').doc(id).update({ status: 'APPROVED', reviewedAt: now, resultTutorId: authUser.uid });
    await recordAuditEvent(adminDb, {
      actor: actor,
      action: 'application.approve',
      targetType: 'application',
      targetId: id,
      summary: `Approved ${application.type.toLowerCase()} application for "${application.fullName}"`,
      metadata: { provisionedUid: authUser.uid, email: application.email },
      request,
    });
    return NextResponse.json({ success: true, tutorId: authUser.uid, resetLink });
  } catch (error: unknown) {
    if (errorCode(error) === 'auth/email-already-exists') {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }
    console.error('Application approval failed:', error);
    logServerError('Application approval failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: 'Approval failed — safe to retry' }, { status: 500 });
  }
}
