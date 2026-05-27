import { describe, it, expect } from 'vitest';
import {
  canViewFullPerson,
  redactLivingPerson,
  getPersonForViewer,
  getPersonLifespanLabel,
} from './personPrivacy';
import type { Person, Tree, TreeMember } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

const publicTree: Pick<Tree, 'isPublic' | 'userId'> = {
  isPublic: true,
  userId: 'owner-1',
};

const privateTree: Pick<Tree, 'isPublic' | 'userId'> = {
  isPublic: false,
  userId: 'owner-1',
};

const livingPerson: Person = {
  id: 'p1',
  firstName: 'Jane',
  lastName: 'Doe',
  middleName: 'M',
  maidenName: 'Smith',
  gender: 'female',
  birthDate: Timestamp.fromDate(new Date(1980, 0, 1)),
  birthPlace: 'Boston',
  deathDate: null,
  deathPlace: null,
  isLiving: true,
  profilePhotoUrl: 'https://example.com/photo.jpg',
  bio: 'Private bio',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

const deceasedPerson: Person = {
  ...livingPerson,
  id: 'p2',
  isLiving: false,
  deathDate: Timestamp.fromDate(new Date('2020-01-01')),
};

const members: Pick<TreeMember, 'userId' | 'role'>[] = [
  { userId: 'editor-1', role: 'editor' },
  { userId: 'viewer-1', role: 'viewer' },
];

describe('canViewFullPerson', () => {
  it('allows full view on private trees', () => {
    expect(canViewFullPerson(privateTree, livingPerson, 'viewer-1', members)).toBe(true);
  });

  it('allows owner and editors on public trees', () => {
    expect(canViewFullPerson(publicTree, livingPerson, 'owner-1', members)).toBe(true);
    expect(canViewFullPerson(publicTree, livingPerson, 'editor-1', members)).toBe(true);
  });

  it('redacts living persons for viewers and anonymous users on public trees', () => {
    expect(canViewFullPerson(publicTree, livingPerson, 'viewer-1', members)).toBe(false);
    expect(canViewFullPerson(publicTree, livingPerson, null, members)).toBe(false);
    expect(canViewFullPerson(publicTree, livingPerson, 'stranger-1', members)).toBe(false);
  });

  it('always allows deceased persons on public trees', () => {
    expect(canViewFullPerson(publicTree, deceasedPerson, 'viewer-1', members)).toBe(true);
  });
});

describe('redactLivingPerson', () => {
  it('removes sensitive fields while keeping identity', () => {
    const redacted = redactLivingPerson(livingPerson);
    expect(redacted.firstName).toBe('Jane');
    expect(redacted.lastName).toBe('Doe');
    expect(redacted.isLiving).toBe(true);
    expect(redacted.birthDate).toBeNull();
    expect(redacted.bio).toBeNull();
    expect(redacted.profilePhotoUrl).toBeNull();
  });
});

describe('getPersonForViewer', () => {
  it('returns redacted copy for restricted viewers', () => {
    const result = getPersonForViewer(livingPerson, publicTree, 'viewer-1', members);
    expect(result.bio).toBeNull();
    expect(result.firstName).toBe('Jane');
  });
});

describe('getPersonLifespanLabel', () => {
  it('shows Living without dates when redacted', () => {
    expect(getPersonLifespanLabel(livingPerson, false)).toBe('Living');
  });

  it('shows birth year when full access', () => {
    expect(getPersonLifespanLabel(livingPerson, true)).toBe('b. 1980');
  });
});
