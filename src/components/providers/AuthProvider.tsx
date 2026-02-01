'use client';

import { useEffect, type ReactNode } from 'react';
import { subscribeToAuthChanges, isUserEmailVerified } from '@/lib/firebase/auth';
import { useAuthStore } from '@/lib/stores/authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setEmailVerified, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
        setEmailVerified(isUserEmailVerified(firebaseUser));
      } else {
        setUser(null);
        setEmailVerified(false);
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setEmailVerified, setInitialized]);

  return <>{children}</>;
}
