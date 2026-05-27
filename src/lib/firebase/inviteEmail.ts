/**
 * Normalize invite emails for storage, lookup, and resolution.
 */
export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function inviteDocIdFromEmail(email: string): string {
  return normalizeInviteEmail(email);
}
