'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, emailVerified, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized) {
      if (!user) {
        router.replace('/login');
      } else if (!emailVerified) {
        router.replace('/verify-email');
      }
    }
  }, [initialized, user, emailVerified, router]);

  if (!initialized) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <FullPageLoader />;
  }

  if (!emailVerified) {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
