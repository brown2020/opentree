'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { isAuthRedirectHeld, subscribeAuthRedirectHold } from '@/lib/auth/redirectHold';
import { pathAfterSessionSync, syncAuthSessionCookie } from '@/lib/auth/session';
import { Button } from '@/components/ui/Button';
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
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const redirectHeld = useSyncExternalStore(
    subscribeAuthRedirectHold,
    isAuthRedirectHeld,
    () => false
  );

  useEffect(() => {
    if (!initialized || !user || redirectHeld) return;
    if (ALLOWED_AUTH_PAGES.includes(pathname ?? '')) return;

    let cancelled = false;

    void (async () => {
      try {
        await syncAuthSessionCookie(user, emailVerified);
        const dest = pathAfterSessionSync(emailVerified, true);
        if (!cancelled && dest) window.location.replace(dest);
      } catch {
        if (!cancelled) {
          setSessionError(
            'We could not start your session. Check your connection and try again.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialized, user, emailVerified, pathname, attempt, redirectHeld]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  if (user && ALLOWED_AUTH_PAGES.includes(pathname ?? '')) {
    return <>{children}</>;
  }

  if (sessionError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Session not started
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sessionError}</p>
          <Button
            className="mt-6"
            onClick={() => {
              setSessionError(null);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (user && !redirectHeld) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
