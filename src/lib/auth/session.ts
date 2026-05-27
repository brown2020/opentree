import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuthStore } from '@/lib/stores/authStore';
import { isUserEmailVerified, getCurrentUser } from '@/lib/firebase/auth';
import type { User } from '@/lib/types';

export const AUTH_COOKIE = 'ot-auth';
export const AUTH_COOKIE_VERIFIED = '1';
export const AUTH_COOKIE_PENDING = 'pending';

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;
const ONE_DAY_SECONDS = 60 * 60 * 24;

/** Sync a lightweight session marker cookie for middleware route checks. */
export function syncAuthSessionCookie(
  user: User | null,
  emailVerified: boolean
): void {
  if (typeof document === 'undefined') return;

  if (user && emailVerified) {
    document.cookie = `${AUTH_COOKIE}=${AUTH_COOKIE_VERIFIED}; path=/; max-age=${ONE_WEEK_SECONDS}; SameSite=Lax`;
  } else if (user) {
    document.cookie = `${AUTH_COOKIE}=${AUTH_COOKIE_PENDING}; path=/; max-age=${ONE_DAY_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
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
