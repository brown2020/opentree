'use client';

import { useAuthStore } from '@/lib/stores/authStore';

export function useAuth() {
  const { user, emailVerified, loading, initialized } = useAuthStore();

  return {
    user,
    emailVerified,
    loading,
    initialized,
    isAuthenticated: !!user && emailVerified,
  };
}
