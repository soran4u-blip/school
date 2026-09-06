import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/core/firebase/admin';
import { Inquiry } from '@/core/types/review';
import { Institution } from '@/core/types/institution';

// GET /api/inquiries/lookup?phone=... — a guest (parent) looks up their own inquiries by phone,
// same pattern as /api/bookings/lookup.
export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const phone = new URL(request.url).searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ success: false, error: 'Missing phone number' }, { status: 400 });
  }

  const snap = await adminDb.collection('inquiries').where('phone', '==', phone).get();

  const institutionIds = [...new Set(snap.docs.map((d) => (d.data() as Inquiry).institutionId))];
  const institutions = new Map<string, Institution>();
  await Promise.all(
    institutionIds.map(async (id) => {
      const inst = await adminDb!.collection('institutions').doc(id).get();
      if (inst.exists) institutions.set(id, inst.data() as Institution);
    })
  );

  const inquiries = snap.docs
    .map((d) => d.data() as Inquiry)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((i) => {
      const inst = institutions.get(i.institutionId);
      return {
        id: i.id,
        institutionId: i.institutionId,
        institutionName: inst?.name || (i.institutionName ? { ar: i.institutionName, en: i.institutionName } : null),
        institutionSlug: inst?.slug || null,
        institutionWhatsapp: inst?.contact?.whatsappNumber || null,
        message: i.message,
        status: i.status,
        createdAt: i.createdAt,
      };
    });

  return NextResponse.json({ success: true, inquiries });
}
