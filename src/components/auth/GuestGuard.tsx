'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface GuestGuardProps {
  children: ReactNode;
}

// Pages that logged-in users can access even if not verified
const ALLOWED_AUTH_PAGES = ['/verify-email', '/email-link'];

export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, emailVerified, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && user) {
      // Allow verify-email and email-link pages for logged-in users
      if (ALLOWED_AUTH_PAGES.includes(pathname)) {
        // If verified and on verify-email, redirect to dashboard
        if (emailVerified && pathname === '/verify-email') {
          router.replace('/');
        }
        return;
      }
      // Redirect verified users to dashboard
      if (emailVerified) {
        router.replace('/');
      } else {
        // Redirect unverified users to verify-email
        router.replace('/verify-email');
      }
    }
  }, [initialized, user, emailVerified, pathname, router]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  // Allow access to allowed auth pages even when logged in
  if (user && ALLOWED_AUTH_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  if (user) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
