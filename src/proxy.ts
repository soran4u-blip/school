import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/core/firebase/admin';
import { SESSION_COOKIE_NAME } from '@/core/server/session';
import { isAdminRole, hasPermission, permissionForPath } from '@/core/permissions';

// Two kinds of gate live here.
//
// The account areas (/tutor, /account, /institution, /employer) each require exactly one role.
// The admin area is capability-based instead: `superadmin`, `moderator` and `editor` all reach
// /admin, but each section demands its own permission — see core/permissions.ts. Doing that check
// here as well as in the route handlers means a role that shouldn't use a section can't even load
// it; the sidebar hiding the link is presentation, not a control.

const PUBLIC_PATHS = ['/admin/login', '/login'];

type AccountRole = 'tutor' | 'student' | 'institution' | 'employer';

function requiredAccountRole(pathname: string): AccountRole | null {
  if (pathname.startsWith('/tutor/dashboard')) return 'tutor';
  if (pathname.startsWith('/account') && !pathname.startsWith('/account/signup')) return 'student';
  if (pathname.startsWith('/api/account')) return 'student';
  if (pathname.startsWith('/institution/dashboard')) return 'institution';
  if (pathname.startsWith('/employer/dashboard')) return 'employer';
  return null;
}

function isAdminArea(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/seed') ||
    pathname.startsWith('/api/applications')
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const adminArea = isAdminArea(pathname);
  const accountRole = requiredAccountRole(pathname);
  if (!adminArea && !accountRole) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie || !adminAuth) {
    return denyAccess(request, isApiRoute, adminArea);
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = decoded.role as string | undefined;

    if (adminArea) {
      if (!isAdminRole(role)) return denyAccess(request, isApiRoute, true);
      // An admin who is signed in but lacks this section's permission is forbidden, not
      // unauthenticated — bouncing them to the login page they just came from would be a loop.
      if (!hasPermission(role, permissionForPath(pathname))) {
        return isApiRoute
          ? NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
          : NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    }

    if (role !== accountRole) return denyAccess(request, isApiRoute, false);
    return NextResponse.next();
  } catch {
    return denyAccess(request, isApiRoute, adminArea);
  }
}

function denyAccess(request: NextRequest, isApiRoute: boolean, adminArea: boolean) {
  if (isApiRoute) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const loginUrl = new URL(adminArea ? '/admin/login' : '/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/seed/:path*',
    '/api/applications/:path*',
    '/tutor/:path*',
    '/account/:path*',
    '/api/account/:path*',
    '/institution/:path*',
    '/employer/:path*',
  ],
};
