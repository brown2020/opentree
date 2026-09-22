import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useAuthStore } from '@/lib/stores/authStore';
import { isUserEmailVerified, getCurrentUser, signOut } from '@/lib/firebase/auth';
import type { User } from '@/lib/types';

export const AUTH_COOKIE = 'ot-auth';
export const AUTH_COOKIE_VERIFIED = '1';
export const AUTH_COOKIE_PENDING = 'pending';

const SESSION_SYNC_TIMEOUT_MS = 8000;
const AUTH_HYDRATION_TIMEOUT_MS = 5000;

function toAppUser(firebaseUser: NonNullable<ReturnType<typeof getCurrentUser>>): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

/**
 * Sync session marker via HttpOnly cookie API (proxy route gate).
 * Awaitable so sign-in / sign-out can wait for the cookie before navigating.
 * Rejects on network failure or timeout so callers can surface errors.
 */
export async function syncAuthSessionCookie(
  user: User | null,
  emailVerified: boolean
): Promise<void> {
  if (typeof window === 'undefined') return;

  const state = !user ? 'cleared' : emailVerified ? 'verified' : 'pending';
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), SESSION_SYNC_TIMEOUT_MS);

  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ state }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Session sync failed (${res.status})`);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Session sync timed out');
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Session sync timed out');
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Best-effort cookie sync for AuthProvider — never throws. */
export function syncAuthSessionCookieSafe(
  user: User | null,
  emailVerified: boolean
): void {
  void syncAuthSessionCookie(user, emailVerified).catch(() => {
    /* non-blocking; proxy may lag until next navigation */
  });
}

/** Wait until Firebase auth state has hydrated the Zustand store with a user. */
export function waitForAuthHydration(
  timeoutMs = AUTH_HYDRATION_TIMEOUT_MS
): Promise<void> {
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

/** Wait until the store reports signed-out (user null) after sign-out. */
export function waitForSignedOut(
  timeoutMs = AUTH_HYDRATION_TIMEOUT_MS
): Promise<void> {
  const { initialized, user } = useAuthStore.getState();
  if (initialized && !user) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsub();
      reject(new Error('Sign-out hydration timeout'));
    }, timeoutMs);

    const unsub = useAuthStore.subscribe((state) => {
      if (state.initialized && !state.user) {
        clearTimeout(timer);
        unsub();
        resolve();
      }
    });
  });
}

function hardNavigate(path: string): void {
  if (typeof window === 'undefined') return;
  window.location.assign(path);
}

/**
 * Navigate after sign-in once the auth store + session cookie reflect the new session.
 * Uses a full navigation so the proxy middleware sees the updated HttpOnly cookie.
 */
export async function navigateAfterSignIn(
  _router?: AppRouterInstance
): Promise<void> {
  const firebaseUser = getCurrentUser();
  const firebaseVerified = isUserEmailVerified(firebaseUser);

  try {
    await waitForAuthHydration();
  } catch {
    // Proceed — cookie sync below may still succeed from Firebase user.
  }

  const { user, emailVerified } = useAuthStore.getState();
  const appUser = user ?? (firebaseUser ? toAppUser(firebaseUser) : null);
  const verified = user ? emailVerified : firebaseVerified;

  if (!appUser) {
    throw new Error('Sign-in succeeded but no user session was established');
  }

  try {
    await syncAuthSessionCookie(appUser, verified);
  } catch {
    // Still navigate; client guards will re-sync if needed.
  }

  hardNavigate(verified ? '/' : '/verify-email');
}

/**
 * Sign out, clear the HttpOnly session cookie, then hard-navigate to login.
 * Prevents AuthGuard spinner hangs when soft navigation races the cookie clear.
 */
export async function completeClientSignOut(): Promise<void> {
  await signOut();

  try {
    await waitForSignedOut();
  } catch {
    // Store may already be clear or AuthProvider lagged — still clear cookie.
  }

  try {
    await syncAuthSessionCookie(null, false);
  } catch {
    // Continue to login even if cookie clear timed out.
  }

  hardNavigate('/login');
}
