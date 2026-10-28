import { describe, expect, it } from 'vitest';
import {
  authErrorMessage,
  firebaseErrorCode,
  shouldRetryVerificationWithoutContinueUrl,
  verificationContinueUrl,
} from './authErrors';

describe('firebaseErrorCode', () => {
  it('reads the code property', () => {
    expect(firebaseErrorCode({ code: 'auth/unauthorized-domain' })).toBe(
      'auth/unauthorized-domain'
    );
  });

  it('reads the code embedded in a Firebase message', () => {
    expect(
      firebaseErrorCode(new Error('Firebase: Error (auth/unauthorized-continue-uri).'))
    ).toBe('auth/unauthorized-continue-uri');
  });
});

describe('shouldRetryVerificationWithoutContinueUrl', () => {
  const preview = 'https://opentree-preview.vercel.app/verify-email';

  it('retries when the continue URL host is not authorized', () => {
    expect(
      shouldRetryVerificationWithoutContinueUrl(
        { code: 'auth/unauthorized-continue-uri' },
        preview
      )
    ).toBe(true);
  });

  it('does not retry a different failure', () => {
    expect(
      shouldRetryVerificationWithoutContinueUrl(
        { code: 'auth/network-request-failed' },
        preview
      )
    ).toBe(false);
  });

  it('does not retry when no continue URL was sent', () => {
    expect(
      shouldRetryVerificationWithoutContinueUrl(
        { code: 'auth/unauthorized-continue-uri' },
        null
      )
    ).toBe(false);
  });
});

describe('verificationContinueUrl', () => {
  it('returns the verify-email page on the current origin', () => {
    expect(verificationContinueUrl('https://opentree-preview.vercel.app/signup')).toBe(
      'https://opentree-preview.vercel.app/verify-email'
    );
  });

  it('returns null for an empty origin', () => {
    expect(verificationContinueUrl('')).toBeNull();
  });
});

describe('authErrorMessage', () => {
  it('explains an unauthorized Google domain without the raw code', () => {
    const message = authErrorMessage({ code: 'auth/unauthorized-domain' });
    expect(message).toMatch(/Google sign-in is not available/i);
    expect(message).not.toMatch(/auth\/unauthorized-domain/);
  });

  it('keeps an unrecognized error message', () => {
    expect(authErrorMessage(new Error('Mailbox unavailable'))).toBe('Mailbox unavailable');
  });
});
