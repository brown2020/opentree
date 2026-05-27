/** Auth routes that should redirect away when already signed in. */
export const AUTH_ENTRY_ROUTES = ['/login', '/signup', '/forgot-password'] as const;

/** Public read-only tree view — no auth required. */
export function isPublicTreeRoute(pathname: string): boolean {
  return /^\/tree\/[^/]+\/public\/?$/.test(pathname);
}

/** Routes that require a verified session cookie. */
export function isProtectedRoute(pathname: string): boolean {
  if (isPublicTreeRoute(pathname)) return false;
  if (pathname === '/') return true;
  if (pathname === '/settings') return true;
  if (pathname.startsWith('/tree/')) return true;
  if (pathname.startsWith('/person/')) return true;
  return false;
}

export function isAuthEntryRoute(pathname: string): boolean {
  return (AUTH_ENTRY_ROUTES as readonly string[]).includes(pathname);
}

export function isEmailVerificationRoute(pathname: string): boolean {
  return pathname === '/verify-email' || pathname === '/email-link';
}

export function shouldSkipMiddleware(pathname: string): boolean {
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api')) return true;
  if (pathname === '/favicon.ico') return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)) return true;
  return false;
}
