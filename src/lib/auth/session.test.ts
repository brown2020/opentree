import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/lib/stores/authStore';

vi.mock('@/lib/firebase/auth', () => ({
  isUserEmailVerified: vi.fn(() => true),
  getCurrentUser: vi.fn(() => null),
  signOut: vi.fn(async () => undefined),
}));

describe('syncAuthSessionCookie', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      emailVerified: false,
      loading: false,
      initialized: true,
    });
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      location: { assign: vi.fn(), replace: vi.fn() },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('posts verified state for a verified user', async () => {
    const { syncAuthSessionCookie } = await import('./session');
    await syncAuthSessionCookie(
      {
        uid: 'u1',
        email: 'a@b.com',
        displayName: 'A',
        photoURL: null,
      },
      true
    );

    expect(fetch).toHaveBeenCalledWith(
      '/api/session',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({ state: 'verified' }),
      })
    );
  });

  it('posts cleared state when user is null', async () => {
    const { syncAuthSessionCookie } = await import('./session');
    await syncAuthSessionCookie(null, false);

    expect(fetch).toHaveBeenCalledWith(
      '/api/session',
      expect.objectContaining({
        body: JSON.stringify({ state: 'cleared' }),
      })
    );
  });

  it('rejects when the session API returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 }))
    );
    const { syncAuthSessionCookie } = await import('./session');
    await expect(syncAuthSessionCookie(null, false)).rejects.toThrow(
      /Session sync failed/
    );
  });

  it('rejects when the session request times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      })
    );
    // Re-bind window timers to fake timers after enabling them.
    vi.stubGlobal('window', {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      location: { assign: vi.fn(), replace: vi.fn() },
    });

    const { syncAuthSessionCookie } = await import('./session');
    const pending = syncAuthSessionCookie(null, false);
    const assertion = expect(pending).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(9000);
    await assertion;
  });
});

describe('waitForAuthHydration', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately when already hydrated with a user', async () => {
    useAuthStore.setState({
      user: {
        uid: 'u1',
        email: 'a@b.com',
        displayName: 'A',
        photoURL: null,
      },
      emailVerified: true,
      loading: false,
      initialized: true,
    });
    const { waitForAuthHydration } = await import('./session');
    await expect(waitForAuthHydration(100)).resolves.toBeUndefined();
  });

  it('rejects on timeout when no user appears', async () => {
    useAuthStore.setState({
      user: null,
      emailVerified: false,
      loading: true,
      initialized: false,
    });
    const { waitForAuthHydration } = await import('./session');
    await expect(waitForAuthHydration(50)).rejects.toThrow(/timeout/);
  });
});
