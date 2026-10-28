import { describe, expect, it } from 'vitest';
import {
  readVerificationEmailNotice,
  rememberVerificationEmailError,
  rememberVerificationEmailSent,
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
