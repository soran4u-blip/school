import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { parseJsonBody } from '@/core/validation/apiValidation';
import { systemSettingsUpdateSchema } from '@/core/validation/schemas';
import { recordAuditEvent } from '@/core/server/auditLog';
import { revalidatePublicData } from '@/core/server/data/cache';
import { logServerError } from '@/core/server/errorLog';
import { errorMessage, errorStack } from '@/lib/errors';

// PATCH /api/admin/settings
//
// The system_settings/global doc used to be written straight from the browser (a plain client-SDK
// setDoc), which is why editing it in /admin/settings never actually reached visitors: Navbar and
// Footer read the public snapshot through getPublicSystemSettings(), which is unstable_cache'd for
// up to REVALIDATE_SECONDS and nothing was ever telling that cache to drop. Routing the write
// through here lets it call revalidatePublicData() the same way every other admin mutation that
// touches cached public data already does.
export async function PATCH(request: NextRequest) {
  const auth = await requirePermission(request, 'settings:write');
  if (auth.error) return auth.error;
  const { db, user } = auth.context;

  const parsed = await parseJsonBody(request, systemSettingsUpdateSchema);
  if (parsed.error) return parsed.error;

  try {
    await db.collection('system_settings').doc('global').set(parsed.data, { merge: true });

    await recordAuditEvent(db, {
      actor: user,
      action: 'settings.update',
      targetType: 'system',
      targetId: 'settings',
      summary: 'Updated system settings',
      metadata: { fields: Object.keys(parsed.data).join(', ') },
      request,
    });

    revalidatePublicData('masterData');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update failed:', error);
    await logServerError('Settings update failed', { stack: errorStack(error), url: request.url });
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not save settings') }, { status: 500 });
  }
}
