import { describe, expect, it } from 'vitest';
import { canonicalAuthEmail } from './authEmail';

describe('canonicalAuthEmail', () => {
  it('lowercases a verified auth email', () => {
    expect(canonicalAuthEmail('  User@Example.com ', true)).toBe('user@example.com');
  });

  it('returns empty when the auth email is not verified', () => {
    expect(canonicalAuthEmail('user@example.com', false)).toBe('');
  });

  it('returns empty when the auth email is missing', () => {
    expect(canonicalAuthEmail(null, true)).toBe('');
  });
});
