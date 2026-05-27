import { format } from 'date-fns';
import type { Person, Tree, TreeMember } from '@/lib/types';

function timestampToDate(timestamp: { toDate(): Date } | null): Date | null {
  return timestamp ? timestamp.toDate() : null;
}

type TreePrivacyContext = Pick<Tree, 'isPublic' | 'userId'> | null | undefined;

/**
 * Whether the current viewer may see full details for a person.
 * Deceased persons are always visible in full. Private trees show full data to all viewers with access.
 * Public trees redact living persons for everyone except the owner and editor members.
 */
export function canViewFullPerson(
  tree: TreePrivacyContext,
  person: Pick<Person, 'isLiving'>,
  userId: string | null | undefined,
  members: Pick<TreeMember, 'userId' | 'role'>[] = []
): boolean {
  if (!person.isLiving) return true;
  if (!tree?.isPublic) return true;
  if (!userId) return false;
  if (tree.userId === userId) return true;
  const member = members.find((m) => m.userId === userId);
  return member?.role === 'editor';
}

/** Strip sensitive fields from a living person record for limited viewers. */
export function redactLivingPerson(person: Person): Person {
  return {
    ...person,
    middleName: null,
    maidenName: null,
    birthDate: null,
    birthPlace: null,
    deathDate: null,
    deathPlace: null,
    bio: null,
    profilePhotoUrl: null,
  };
}

export function getPersonForViewer(
  person: Person,
  tree: TreePrivacyContext,
  userId: string | null | undefined,
  members: Pick<TreeMember, 'userId' | 'role'>[] = []
): Person {
  if (canViewFullPerson(tree, person, userId, members)) {
    return person;
  }
  return redactLivingPerson(person);
}

/** Lifespan string for tree cards, search, and visualization nodes. */
export function getPersonLifespanLabel(
  person: Person,
  canViewFull: boolean
): string {
  if (person.isLiving && !canViewFull) {
    return 'Living';
  }

  const birthDate = timestampToDate(person.birthDate);
  const deathDate = timestampToDate(person.deathDate);

  if (!birthDate) {
    return person.isLiving ? 'Living' : '';
  }

  const birth = format(birthDate, 'yyyy');
  if (person.isLiving) return `b. ${birth}`;
  if (deathDate) return `${birth} – ${format(deathDate, 'yyyy')}`;
  return `b. ${birth}`;
}

export function preparePersonsForViewer(
  persons: Person[],
  tree: TreePrivacyContext,
  userId: string | null | undefined,
  members: Pick<TreeMember, 'userId' | 'role'>[] = []
): Person[] {
  return persons.map((person) =>
    getPersonForViewer(person, tree, userId, members)
  );
}
