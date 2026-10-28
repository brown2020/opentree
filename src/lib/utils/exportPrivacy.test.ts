import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { personsIncludedInFullExport } from './exportZip';
import type { Person, Tree, TreeMember } from '@/lib/types';

const publicTree: Pick<Tree, 'isPublic' | 'userId'> = {
  isPublic: true,
  userId: 'owner-1',
};

const living: Person = {
  id: 'live',
  firstName: 'Jane',
  lastName: 'Doe',
  middleName: null,
  maidenName: null,
  gender: 'female',
  birthDate: Timestamp.fromDate(new Date(1980, 0, 1)),
  birthPlace: 'Boston',
  deathDate: null,
  deathPlace: null,
  isLiving: true,
  profilePhotoUrl: null,
  bio: 'secret',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const deceased: Person = { ...living, id: 'dead', isLiving: false, bio: 'public' };

const members: Pick<TreeMember, 'userId' | 'accessLevel'>[] = [
  { userId: 'viewer-1', accessLevel: 'viewer' },
];

describe('personsIncludedInFullExport', () => {
  it('omits living people from a public-tree viewer export', () => {
    const included = personsIncludedInFullExport([living, deceased], {
      tree: publicTree,
      userId: 'viewer-1',
      members,
    });
    expect(included.map((person) => person.id)).toEqual(['dead']);
  });

  it('includes living people for the owner', () => {
    const included = personsIncludedInFullExport([living], {
      tree: publicTree,
      userId: 'owner-1',
      members,
    });
    expect(included.map((person) => person.id)).toEqual(['live']);
  });
});
