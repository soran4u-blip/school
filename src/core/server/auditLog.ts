import type { Firestore } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';
import { AuditAction, AuditLogEntry, AuditTargetType } from '@/core/types/auditLog';
import { SessionUser } from '@/core/server/session';
import { getClientIp } from '@/core/server/rateLimit';

// Writes to the audit trail. See core/types/auditLog.ts for what belongs in it.

const COLLECTION = 'auditLogs';

// The scheduler has no user behind it, but its actions still need attributing.
export const SYSTEM_ACTOR: SessionUser = { uid: 'system', role: undefined };

export async function recordAuditEvent(
  db: Firestore,
  entry: {
    actor: SessionUser;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    summary: string;
    metadata?: Record<string, string | number | boolean | null>;
    request?: NextRequest;
  }
): Promise<void> {
  try {
    const ref = db.collection(COLLECTION).doc();
    const record: AuditLogEntry = {
      id: ref.id,
      actorUid: entry.actor.uid,
      actorRole: entry.actor.role || 'system',
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      summary: entry.summary,
      createdAt: new Date().toISOString(),
      ...(entry.metadata ? { metadata: entry.metadata } : {}),
      ...(entry.request ? { ip: getClientIp(entry.request) } : {}),
    };
    await ref.set(record);
  } catch (error) {
    // An audit write must never be the reason a legitimate admin action fails. It is logged
    // loudly instead, because a silently missing trail is the failure mode that matters.
    console.error('Failed to record audit event:', entry.action, entry.targetId, error);
  }
}

export interface AuditLogPage {
  items: AuditLogEntry[];
  nextCursor: string | null;
}

/**
 * Newest-first page of the audit trail. Cursor is the previous page's last `createdAt` — the
 * collection only grows, so an offset would drift as new entries land while someone is paging.
 */
export async function getAuditLogPage(db: Firestore, pageSize: number, cursor?: string): Promise<AuditLogPage> {
  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc').limit(pageSize + 1);
  if (cursor) query = query.startAfter(cursor);

  const snap = await query.get();
  const docs = snap.docs.slice(0, pageSize);
  return {
    items: docs.map((d) => ({ ...(d.data() as AuditLogEntry), id: d.id })),
    nextCursor: snap.docs.length > pageSize ? docs[docs.length - 1].get('createdAt') : null,
  };
}
