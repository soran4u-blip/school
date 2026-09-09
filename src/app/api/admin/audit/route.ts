import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/core/server/session';
import { getAuditLogPage } from '@/core/server/auditLog';
import { errorMessage } from '@/lib/errors';

const PAGE_SIZE = 50;

// GET /api/admin/audit?cursor=<createdAt> — a page of the audit trail, newest first.
// Read-only by design: there is no write endpoint, and firestore.rules denies client writes, so
// the trail can't be edited by the people it records.
export async function GET(request: NextRequest) {
  const auth = await requirePermission(request, 'audit:read');
  if (auth.error) return auth.error;

  try {
    const cursor = request.nextUrl.searchParams.get('cursor') || undefined;
    const page = await getAuditLogPage(auth.context.db, PAGE_SIZE, cursor);
    return NextResponse.json({ success: true, ...page });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error, 'Could not load the audit log') }, { status: 500 });
  }
}
