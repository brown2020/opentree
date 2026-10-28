import { describe, expect, it } from 'vitest';
import {
  VERIFICATION_RATE_LIMIT_MESSAGE,
  isVerificationRateLimitMessage,
  presentVerificationError,
  readVerificationEmailNotice,
  rememberVerificationEmailError,
  rememberVerificationEmailSent,
  resendCooldownSeconds,
  type NoticeStorage,
} from './verificationNotice';

function memoryStorage(): NoticeStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

describe('verification email notice', () => {
  it('records a successful send and clears a previous error', () => {
    const storage = memoryStorage();
    rememberVerificationEmailError('not sent', storage);
    rememberVerificationEmailSent(storage);
    expect(readVerificationEmailNotice(storage)).toEqual({ sent: true, error: null });
  });

  it('turns a rate-limit error into a resend message and cooldown', () => {
    expect(isVerificationRateLimitMessage('Too many attempts. Please wait.')).toBe(true);
    expect(presentVerificationError('Firebase: Error (auth/too-many-requests).')).toBe(
      VERIFICATION_RATE_LIMIT_MESSAGE
    );
    expect(presentVerificationError('Missing or insufficient permissions.')).toBe(
      'Missing or insufficient permissions.'
    );
    const start = 1_000_000;
    expect(resendCooldownSeconds(start + 60_000, start)).toBe(60);
    expect(resendCooldownSeconds(start + 500, start)).toBe(1);
    expect(resendCooldownSeconds(start, start + 1000)).toBe(0);
    expect(resendCooldownSeconds(null, start)).toBe(0);
  });

  it('records a failure and clears a previous success', () => {
    const storage = memoryStorage();
    rememberVerificationEmailSent(storage);
    rememberVerificationEmailError('Mailbox unavailable', storage);
    expect(readVerificationEmailNotice(storage)).toEqual({
      sent: false,
      error: 'Mailbox unavailable',
    });
  });
});
