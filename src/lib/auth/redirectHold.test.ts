import { describe, expect, it, vi } from 'vitest';
import {
  holdAuthRedirect,
  isAuthRedirectHeld,
  subscribeAuthRedirectHold,
} from './redirectHold';

describe('holdAuthRedirect', () => {
  it('stays held until every hold is released', () => {
    const releaseA = holdAuthRedirect();
    const releaseB = holdAuthRedirect();
    expect(isAuthRedirectHeld()).toBe(true);
    releaseA();
    expect(isAuthRedirectHeld()).toBe(true);
    releaseB();
    expect(isAuthRedirectHeld()).toBe(false);
  });

  it('notifies subscribers and ignores a second release', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthRedirectHold(listener);
    const release = holdAuthRedirect();
    release();
    release();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(isAuthRedirectHeld()).toBe(false);
    unsubscribe();
  });
});
