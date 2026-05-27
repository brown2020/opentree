import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isProtectedRoute,
  isAuthEntryRoute,
  isEmailVerificationRoute,
  shouldSkipMiddleware,
} from '@/lib/auth/routes';
import {
  AUTH_COOKIE,
  AUTH_COOKIE_VERIFIED,
  AUTH_COOKIE_PENDING,
} from '@/lib/auth/session';

/**
 * Defense-in-depth route protection using a client-synced session cookie.
 * Firestore/Storage rules remain the authoritative data boundary.
 * Full cryptographic verification requires Firebase Admin SDK session cookies.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;

  if (isProtectedRoute(pathname)) {
    if (authCookie === AUTH_COOKIE_PENDING) {
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
    if (authCookie !== AUTH_COOKIE_VERIFIED) {
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAuthEntryRoute(pathname)) {
    if (authCookie === AUTH_COOKIE_VERIFIED) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (authCookie === AUTH_COOKIE_PENDING) {
      return NextResponse.redirect(new URL('/verify-email', request.url));
    }
  }

  // Allow verify-email and email-link through; client guards handle edge cases.
  if (isEmailVerificationRoute(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
