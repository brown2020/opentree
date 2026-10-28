import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  personDataHasSensitiveFields,
  pickSensitiveFields,
  toPerson,
} from './personRecords';

describe('personDataHasSensitiveFields', () => {
  it('is false for a public-safe person document', () => {
    expect(
      personDataHasSensitiveFields({
        firstName: 'Ada',
        lastName: 'Lovelace',
        gender: 'female',
        isLiving: true,
      })
    ).toBe(false);
  });

  it('is true when a birth date is still stored on the person document', () => {
    expect(
      personDataHasSensitiveFields({
        firstName: 'Ada',
        birthDate: Timestamp.now(),
      })
    ).toBe(true);
  });
});

describe('pickSensitiveFields', () => {
  it('copies only restricted keys', () => {
    expect(
      pickSensitiveFields({
        firstName: 'Ada',
        bio: 'Mathematician',
        profilePhotoUrl: 'https://firebasestorage.googleapis.com/photo.jpg',
      })
    ).toEqual({
      bio: 'Mathematician',
      profilePhotoUrl: 'https://firebasestorage.googleapis.com/photo.jpg',
    });
  });
});

describe('toPerson', () => {
  it('prefers restricted profile fields over legacy parent fields', () => {
    const person = toPerson(
      'p1',
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        gender: 'female',
        isLiving: false,
        bio: 'stale',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      { bio: 'from profile', birthPlace: 'London' }
    );

    expect(person.bio).toBe('from profile');
    expect(person.birthPlace).toBe('London');
    expect(person.firstName).toBe('Ada');
  });

  it('leaves sensitive fields empty when no restricted profile is readable', () => {
    const person = toPerson('p2', {
      firstName: 'Grace',
      lastName: 'Hopper',
      gender: 'female',
      isLiving: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    expect(person.bio).toBeNull();
    expect(person.birthDate).toBeNull();
    expect(person.profilePhotoUrl).toBeNull();
    expect(person.isLiving).toBe(true);
  });
});
