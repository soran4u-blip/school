import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/core/firebase/admin';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';

// Session-cookie verification, in one place. Sixteen route handlers previously each re-declared
// the cookie name and repeated the same verify/decode/role-check dance, which is how a route
// ends up quietly missing a check (see /api/seed, which shipped with none at all).

export const SESSION_COOKIE_NAME = 'session';

export type { AppRole } from '@/core/permissions';
import type { AppRole } from '@/core/permissions';
import { hasPermission, Permission } from '@/core/permissions';

export interface SessionUser {
  uid: string;
  role?: AppRole;
  tutorId?: string;
  institutionId?: string;
  employerId?: string;
  // Set as a custom claim at student signup; /api/account/inquiries matches guest inquiries on it.
  phone?: string;
}

// Decodes the session cookie if there is a valid one. Returns null for an absent, malformed,
// expired or revoked cookie — callers that require an identity should use requireRole().
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie || !adminAuth) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      role: decoded.role as AppRole | undefined,
      tutorId: decoded.tutorId as string | undefined,
      institutionId: decoded.institutionId as string | undefined,
      employerId: decoded.employerId as string | undefined,
      phone: decoded.phone as string | undefined,
    };
  } catch {
    return null;
  }
}

// The Admin SDK handles nulled out when the service account is missing, plus the caller's
// identity — bundled so a route can destructure one result instead of null-checking three things.
export interface AuthorizedContext {
  user: SessionUser;
  auth: Auth;
  db: Firestore;
}

// Guards a route on a role. On success returns { context }; on failure returns { error } holding
// the response to return as-is, so the happy path in a handler stays unindented.
export async function requireRole(
  request: NextRequest,
  role: AppRole
): Promise<{ context: AuthorizedContext; error?: undefined } | { context?: undefined; error: NextResponse }> {
  return authorize(request, (user) => user.role === role);
}

/**
 * Guards a route on a capability rather than a specific role — see core/permissions.ts. Prefer
 * this for the admin surface: `requireRole(request, 'superadmin')` would now lock out the
 * moderator and editor roles that are supposed to reach some of it.
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ context: AuthorizedContext; error?: undefined } | { context?: undefined; error: NextResponse }> {
  return authorize(request, (user) => hasPermission(user.role, permission));
}

async function authorize(
  request: NextRequest,
  allowed: (user: SessionUser) => boolean
): Promise<{ context: AuthorizedContext; error?: undefined } | { context?: undefined; error: NextResponse }> {
  if (!adminAuth || !adminDb) {
    return { error: NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 }) };
  }
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!allowed(user)) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { context: { user, auth: adminAuth, db: adminDb } };
}
