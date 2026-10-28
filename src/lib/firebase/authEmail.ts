import { normalizeInviteEmail } from './inviteEmail';

/**
 * Email used for invite matching. Mirrors firestore.rules canonicalUserEmail():
 * the verified auth token, trimmed and lowercased. Unverified sessions match nothing.
 */
export function canonicalAuthEmail(
  email: string | null | undefined,
  emailVerified: boolean
): string {
  if (!emailVerified) return '';
  return normalizeInviteEmail(email ?? '');
}
