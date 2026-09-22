import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuthStore } from '@/lib/stores/authStore';
import { isUserEmailVerified, getCurrentUser } from '@/lib/firebase/auth';
import type { User } from '@/lib/types';

export const AUTH_COOKIE = 'ot-auth';
export const AUTH_COOKIE_VERIFIED = '1';
export const AUTH_COOKIE_PENDING = 'pending';

/** Sync session marker via HttpOnly cookie API (proxy route gate). */
export function syncAuthSessionCookie(
  user: User | null,
  emailVerified: boolean
): void {
  if (typeof window === 'undefined') return;

  const state = !user ? 'cleared' : emailVerified ? 'verified' : 'pending';
  void fetch('/api/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ state }),
  }).catch(() => {
    /* non-blocking; proxy may lag until next navigation */
  });
}

/** Wait until Firebase auth state has hydrated the Zustand store with a user. */
export function waitForAuthHydration(timeoutMs = 5000): Promise<void> {
  const { initialized, user } = useAuthStore.getState();
  if (initialized && user) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error('Auth hydration timeout'));
    }, timeoutMs);

    const unsub = useAuthStore.subscribe((state) => {
      if (state.initialized && state.user) {
        clearTimeout(timer);
        unsub();
        resolve();
      }
    });
  });
}

/** Navigate after sign-in once the auth store reflects the new session. */
export async function navigateAfterSignIn(
  router: AppRouterInstance
): Promise<void> {
  const firebaseUser = getCurrentUser();
  const verified = isUserEmailVerified(firebaseUser);

  try {
    await waitForAuthHydration();
  } catch {
    // Proceed — cookie sync in AuthProvider may still be in flight.
  }

  router.push(verified ? '/' : '/verify-email');
}
