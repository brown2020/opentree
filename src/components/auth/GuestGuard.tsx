'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { syncAuthSessionCookie } from '@/lib/auth/session';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface GuestGuardProps {
  children: ReactNode;
}

const ALLOWED_AUTH_PAGES = ['/verify-email', '/email-link'];

/**
 * Client render gate for guest-only auth entry pages.
 * Route redirects are handled by src/proxy.ts (cookie-based) plus a
 * client fallback so a soft-nav / cookie race never leaves a forever spinner.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const pathname = usePathname();
  const { user, emailVerified, initialized } = useAuthStore();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!initialized || !user || redirectingRef.current) return;
    if (ALLOWED_AUTH_PAGES.includes(pathname ?? '')) return;

    redirectingRef.current = true;
    let cancelled = false;
    const dest = emailVerified ? '/' : '/verify-email';

    void (async () => {
      try {
        await syncAuthSessionCookie(user, emailVerified);
      } catch {
        // Navigate anyway — destination matches store state.
      }
      if (!cancelled) window.location.replace(dest);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, user, emailVerified, pathname]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  if (user && ALLOWED_AUTH_PAGES.includes(pathname ?? '')) {
    return <>{children}</>;
  }

  if (user) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
