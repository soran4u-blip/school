import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { Institution } from '@/core/types/institution';
import { canPublishInstitution } from '@/lib/publishingGuardrails';
import { recordAuditEvent } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';

function validateInstitution(value: unknown): value is Institution {
  if (!value || typeof value !== 'object') return false;
  const institution = value as Partial<Institution>;
  return Boolean(
    institution.id &&
    institution.name?.ar &&
    institution.name?.en &&
    institution.categoryId &&
    institution.governorateId &&
    institution.contact?.phonePrimary !== undefined &&
    ['DRAFT', 'ACTIVE', 'PENDING', 'SUSPENDED'].includes(institution.status || '')
  );
}

async function save(request: NextRequest, mode: 'create' | 'update') {
  const auth = await requirePermission(request, 'directory:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!validateInstitution(body)) {
    return NextResponse.json({ success: false, error: 'Missing required institution fields' }, { status: 400 });
  }

  const institution = body as Institution;
  const ref = db.collection('institutions').doc(institution.id);
  const existing = await ref.get();
  if (mode === 'create' && existing.exists) return NextResponse.json({ success: false, error: 'Institution already exists' }, { status: 409 });
  if (mode === 'update' && !existing.exists) return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });

  if (institution.status === 'ACTIVE') {
    const assessment = canPublishInstitution(institution);
    if (!assessment.publishable) {
      return NextResponse.json(
        { success: false, error: 'Institution is not ready to publish', missingFields: assessment.missingFields, score: assessment.score },
        { status: 422 }
      );
    }
  }

  const now = new Date().toISOString();
  const previous = existing.exists ? (existing.data() as Institution) : undefined;
  const toSave: Institution = {
    ...institution,
    createdAt: previous?.createdAt || institution.createdAt || now,
    updatedAt: now,
  };
  await ref.set(toSave);

  if (previous?.status !== toSave.status) {
    await recordAuditEvent(db, {
      actor: user,
      action: 'listing.status',
      targetType: 'institution',
      targetId: toSave.id,
      summary: `Set institution "${toSave.name.en || toSave.name.ar}" status to ${toSave.status}`,
      metadata: { from: previous?.status || '', to: toSave.status },
      request,
    });
  }
  revalidatePublicData('institutions');
  return NextResponse.json({ success: true, institution: toSave });
}

export async function POST(request: NextRequest) {
  return save(request, 'create');
}

export async function PATCH(request: NextRequest) {
  return save(request, 'update');
}
