'use client';

import { useEffect, type ReactNode } from 'react';
import { subscribeToAuthChanges, isUserEmailVerified } from '@/lib/firebase/auth';
import { syncAuthSessionCookie } from '@/lib/auth/session';
import { useAuthStore } from '@/lib/stores/authStore';
import type { User } from '@/lib/types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setEmailVerified, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        };
        const verified = isUserEmailVerified(firebaseUser);
        setUser(appUser);
        setEmailVerified(verified);
        syncAuthSessionCookie(appUser, verified);
      } else {
        setUser(null);
        setEmailVerified(false);
        syncAuthSessionCookie(null, false);
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setEmailVerified, setInitialized]);

  return <>{children}</>;
}
