import { adminDb } from '@/core/firebase/admin';
import { getAuditLogPage } from '@/core/server/auditLog';
import AuditLogView from './AuditLogView';

// Who did what. See core/types/auditLog.ts for which actions are recorded and why the admin
// mutations that matter were moved off direct client-SDK writes to make this possible.
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function AdminAuditPage() {
  const page = adminDb
    ? await getAuditLogPage(adminDb, PAGE_SIZE)
    : { items: [], nextCursor: null };

  return <AuditLogView initialItems={page.items} initialCursor={page.nextCursor} />;
}
