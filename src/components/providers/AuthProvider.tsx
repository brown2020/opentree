'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import {
  subscribeToAuthChanges,
  isUserEmailVerified,
  ensureUserDirectory,
  clearStoredProfilePhotoUrl,
} from '@/lib/firebase/auth';
import { resolvePendingInvitesForUser } from '@/lib/firebase/members';
import { syncAuthSessionCookieSafe } from '@/lib/auth/session';
import { useAuthStore } from '@/lib/stores/authStore';
import type { User } from '@/lib/types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setEmailVerified, setInitialized } = useAuthStore();
  const resolvingInvitesRef = useRef(false);

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
        syncAuthSessionCookieSafe(appUser, verified);

        void ensureUserDirectory(firebaseUser).catch(() => {
          // Directory lookup is best-effort and must not block sign-in.
        });
        void clearStoredProfilePhotoUrl(firebaseUser.uid).catch(() => {
          // Removing a legacy photo URL must not block sign-in.
        });

        if (verified && firebaseUser.email && !resolvingInvitesRef.current) {
          resolvingInvitesRef.current = true;
          void resolvePendingInvitesForUser(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName
          )
            .catch(() => {
              // Non-blocking — invite resolution must not break auth bootstrap
            })
            .finally(() => {
              resolvingInvitesRef.current = false;
            });
        }
      } else {
        setUser(null);
        setEmailVerified(false);
        syncAuthSessionCookieSafe(null, false);
      }
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [setUser, setEmailVerified, setInitialized]);

  return <>{children}</>;
}
