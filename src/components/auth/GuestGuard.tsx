'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface GuestGuardProps {
  children: ReactNode;
}

const ALLOWED_AUTH_PAGES = ['/verify-email', '/email-link'];

/**
 * Client render gate for guest-only auth entry pages.
 * Route redirects are handled by src/proxy.ts (cookie-based).
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const pathname = usePathname();
  const { user, initialized } = useAuthStore();

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
