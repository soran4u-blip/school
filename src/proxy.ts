import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/core/firebase/admin';

const SESSION_COOKIE_NAME = 'session';
const PUBLIC_PATHS = ['/admin/login', '/login'];

function requiredRole(pathname: string): 'superadmin' | 'tutor' | 'student' | 'institution' | null {
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/seed') || pathname.startsWith('/api/applications')) return 'superadmin';
  if (pathname.startsWith('/tutor/dashboard')) return 'tutor';
  if (pathname.startsWith('/account') && !pathname.startsWith('/account/signup')) return 'student';
  if (pathname.startsWith('/api/account')) return 'student';
  if (pathname.startsWith('/institution/dashboard')) return 'institution';
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const role = requiredRole(pathname);
  if (!role) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie || !adminAuth) {
    return denyAccess(request, isApiRoute, role);
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.role !== role) {
      return denyAccess(request, isApiRoute, role);
    }
    return NextResponse.next();
  } catch {
    return denyAccess(request, isApiRoute, role);
  }
}

function denyAccess(request: NextRequest, isApiRoute: boolean, role: 'superadmin' | 'tutor' | 'student' | 'institution') {
  if (isApiRoute) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const loginPath = role === 'superadmin' ? '/admin/login' : '/login';
  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/seed/:path*', '/api/applications/:path*', '/tutor/:path*', '/account/:path*', '/api/account/:path*', '/institution/:path*'],
};
