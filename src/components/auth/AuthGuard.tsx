'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { syncAuthSessionCookie } from '@/lib/auth/session';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Client render gate for authenticated, verified users.
 * Route redirects are handled by src/proxy.ts (cookie-based) plus a
 * client fallback so a soft-nav / cookie race never leaves a forever spinner.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, emailVerified, initialized } = useAuthStore();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!initialized || redirectingRef.current) return;
    if (user && emailVerified) return;

    redirectingRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        if (!user) {
          await syncAuthSessionCookie(null, false);
          if (!cancelled) window.location.replace('/login');
          return;
        }
        await syncAuthSessionCookie(user, false);
        if (!cancelled) window.location.replace('/verify-email');
      } catch {
        if (!cancelled) {
          window.location.replace(user ? '/verify-email' : '/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, user, emailVerified]);

  if (!initialized || !user || !emailVerified) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
