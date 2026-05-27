import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildPedigreeChartSvg } from './pedigreeChartExport';
import { redactLivingPerson } from './personPrivacy';
import type { Person, Relationship } from '@/lib/types';
import { getPersonLifespanLabel } from './personPrivacy';

const basePerson: Omit<Person, 'id'> = {
  firstName: 'John',
  lastName: 'Smith',
  middleName: null,
  maidenName: null,
  gender: 'male',
  birthDate: Timestamp.fromDate(new Date(1980, 0, 15)),
  birthPlace: 'Boston',
  deathDate: null,
  deathPlace: null,
  isLiving: true,
  profilePhotoUrl: null,
  bio: 'Bio text',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
};

function fullAccessLifespan(person: Person): string {
  return getPersonLifespanLabel(person, true);
}

describe('buildPedigreeChartSvg', () => {
  const parent: Person = { ...basePerson, id: 'parent-1' };
  const child: Person = {
    ...basePerson,
    id: 'child-1',
    firstName: 'Jane',
    lastName: 'Smith',
    birthDate: Timestamp.fromDate(new Date(2010, 5, 1)),
  };
  const relationships: Relationship[] = [
    {
      id: 'rel-1',
      type: 'parent-child',
      person1Id: 'parent-1',
      person2Id: 'child-1',
      marriageDate: null,
      divorceDate: null,
      createdAt: Timestamp.now(),
    },
  ];

  it('returns SVG with tree title and person names', () => {
    const svg = buildPedigreeChartSvg({
      persons: [parent, child],
      relationships,
      rootPersonId: 'parent-1',
      treeName: 'Smith Family',
      getLifespanLabel: fullAccessLifespan,
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('Smith Family');
    expect(svg).toContain('John Smith');
    expect(svg).toContain('Jane Smith');
    expect(svg).toContain('b. 1980');
  });

  it('redacts living person lifespan in exported chart', () => {
    const redacted = redactLivingPerson(parent);
    const svg = buildPedigreeChartSvg({
      persons: [redacted, child],
      relationships,
      rootPersonId: 'parent-1',
      treeName: 'Public Tree',
      getLifespanLabel: (person) =>
        getPersonLifespanLabel(person, person.id === 'child-1'),
    });

    expect(svg).toContain('Living');
    expect(svg).not.toContain('b. 1980');
    expect(svg).not.toContain('Boston');
  });

  it('uses letter-friendly dimensions', () => {
    const svg = buildPedigreeChartSvg({
      persons: [parent],
      relationships: [],
      rootPersonId: 'parent-1',
      treeName: 'Test',
      getLifespanLabel: fullAccessLifespan,
    });

    expect(svg).toContain('width="816"');
    expect(svg).toContain('height="1056"');
  });

  it('handles empty tree gracefully', () => {
    const svg = buildPedigreeChartSvg({
      persons: [],
      relationships: [],
      rootPersonId: 'missing',
      treeName: 'Empty',
      getLifespanLabel: fullAccessLifespan,
    });

    expect(svg).toContain('No people in tree');
  });
});
