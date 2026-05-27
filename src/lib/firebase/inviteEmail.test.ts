import { describe, it, expect } from 'vitest';
import { normalizeInviteEmail, inviteDocIdFromEmail } from './inviteEmail';

describe('normalizeInviteEmail', () => {
  it('trims and lowercases email', () => {
    expect(normalizeInviteEmail('  User@Example.COM  ')).toBe('user@example.com');
  });
});

describe('inviteDocIdFromEmail', () => {
  it('uses normalized email as document id', () => {
    expect(inviteDocIdFromEmail('Invite@Mail.com')).toBe('invite@mail.com');
  });
});
