'use client';

import type { ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Client render gate for authenticated, verified users.
 * Route redirects are handled by src/proxy.ts (cookie-based).
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, emailVerified, initialized } = useAuthStore();

  if (!initialized || !user || !emailVerified) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
