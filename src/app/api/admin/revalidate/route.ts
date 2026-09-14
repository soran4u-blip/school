import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { revalidatePublicData } from '@/core/server/data/cache';

// POST /api/admin/revalidate — bust the 'masterData' cache tag (governorates, cities, categories,
// subcategories, taxonomies, quick-search tags, system settings) after a direct client-SDK write
// to one of those collections.
//
// locationService/categoryService/taxonomyService write straight from the browser (small,
// low-traffic master data, already gated by firestore.rules' canEditDirectory()/masterData:write
// check) rather than through a server route each — there's no per-field trust decision here the
// way isVerified or a booking price is, so there's nothing worth an audit-log entry. But the
// public read side (getPublicGovernorates/getPublicCategories/getPublicTaxonomies/... in
// core/server/data/masterData.ts) is unstable_cache'd for up to REVALIDATE_SECONDS, and a plain
// client write has no way to call revalidatePublicData() itself — hence this one small endpoint,
// called after every save/delete in those three services.
export async function POST(request: NextRequest) {
  const auth = await requirePermission(request, 'masterData:write');
  if (auth.error) return auth.error;

  revalidatePublicData('masterData');
  return NextResponse.json({ success: true });
}
