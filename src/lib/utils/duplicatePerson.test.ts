import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  normalizePersonName,
  birthYearsCompatible,
  findSimilarPersons,
  findGedcomImportDuplicates,
} from './duplicatePerson';
import type { Person } from '@/lib/types';
import type { ParsedPerson } from '@/lib/utils/gedcom';

const basePerson: Omit<Person, 'id'> = {
  firstName: 'John',
  lastName: 'Smith',
  middleName: null,
  maidenName: null,
  gender: 'male',
  birthDate: Timestamp.fromDate(new Date(1980, 0, 15)),
  birthPlace: null,
  deathDate: null,
  deathPlace: null,
  isLiving: true,
  profilePhotoUrl: null,
  bio: null,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

describe('normalizePersonName', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizePersonName('  John ', ' SMITH')).toBe('john smith');
  });
});

describe('birthYearsCompatible', () => {
  it('matches same year', () => {
    expect(
      birthYearsCompatible(new Date(1980, 5, 1), new Date(1980, 0, 1))
    ).toBe(true);
  });

  it('rejects different years when both known', () => {
    expect(
      birthYearsCompatible(new Date(1980, 0, 1), new Date(1979, 0, 1))
    ).toBe(false);
  });

  it('allows match when either year is unknown', () => {
    expect(birthYearsCompatible(new Date(1980, 0, 1), null)).toBe(true);
  });
});

describe('findSimilarPersons', () => {
  const persons: Person[] = [
    { ...basePerson, id: 'p1' },
    {
      ...basePerson,
      id: 'p2',
      firstName: 'Jane',
      birthDate: Timestamp.fromDate(new Date(1985, 0, 1)),
    },
    {
      ...basePerson,
      id: 'p3',
      firstName: 'John',
      lastName: 'Smith',
      birthDate: Timestamp.fromDate(new Date(1970, 0, 1)),
    },
  ];

  it('finds same name and birth year', () => {
    const matches = findSimilarPersons(
      'John',
      'Smith',
      new Date(1980, 6, 1),
      persons
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].person.id).toBe('p1');
  });

  it('excludes person by id', () => {
    const matches = findSimilarPersons(
      'John',
      'Smith',
      new Date(1980, 0, 1),
      persons,
      'p1'
    );
    expect(matches).toHaveLength(0);
  });

  it('ignores different birth years', () => {
    const matches = findSimilarPersons(
      'John',
      'Smith',
      new Date(1980, 0, 1),
      persons
    );
    expect(matches.some((m) => m.person.id === 'p3')).toBe(false);
  });
});

describe('findGedcomImportDuplicates', () => {
  it('returns deduped matches against existing persons', () => {
    const existing: Person[] = [{ ...basePerson, id: 'existing-1' }];
    const parsed: ParsedPerson[] = [
      {
        gedcomId: 'I1',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        birthDate: new Date(1980, 0, 1),
        birthPlace: null,
        deathDate: null,
        deathPlace: null,
        isLiving: true,
        bio: null,
      },
      {
        gedcomId: 'I2',
        firstName: 'John',
        lastName: 'Smith',
        gender: 'male',
        birthDate: new Date(1980, 5, 1),
        birthPlace: null,
        deathDate: null,
        deathPlace: null,
        isLiving: true,
        bio: null,
      },
    ];

    const matches = findGedcomImportDuplicates(parsed, existing);
    expect(matches).toHaveLength(1);
    expect(matches[0].existingPerson.id).toBe('existing-1');
  });
});
