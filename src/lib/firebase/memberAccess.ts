/**
 * Mirrors the invite-accept memberIds rule: the next list is the previous
 * list plus the caller, with nobody removed and nobody else added.
 */
export function memberIdsAddsOnlySelf(
  previous: readonly string[] | null | undefined,
  next: readonly string[] | null | undefined,
  uid: string
): boolean {
  if (!Array.isArray(previous) || !Array.isArray(next)) return false;
  if (previous.includes(uid)) return false;
  if (!next.includes(uid)) return false;
  if (next.length !== previous.length + 1) return false;
  return previous.every((id) => next.includes(id));
}

/** Editor authority is accessLevel only. A legacy role field must not grant edit. */
export function isEditorAccess(accessLevel: string | null | undefined): boolean {
  return accessLevel === 'editor';
}
