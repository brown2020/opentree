import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { layoutFamilyTree } from './familyTreeLayout';
import { calculateRelationship } from './relationshipCalculator';
import type { Person, Relationship, RelationshipType } from '@/lib/types';

const now = Timestamp.fromDate(new Date('2020-01-01T00:00:00Z'));

function person(id: string, firstName: string): Person {
  return {
    id,
    firstName,
    lastName: 'Tree',
    middleName: null,
    maidenName: null,
    gender: 'unknown',
    birthDate: null,
    birthPlace: null,
    deathDate: null,
    deathPlace: null,
    isLiving: true,
    profilePhotoUrl: null,
    bio: null,
    createdAt: now,
    updatedAt: now,
  };
}

function rel(
  id: string,
  type: RelationshipType,
  person1Id: string,
  person2Id: string
): Relationship {
  return {
    id,
    type,
    person1Id,
    person2Id,
    marriageDate: null,
    divorceDate: null,
    createdAt: now,
  };
}

const persons = [
  person('parent', 'Pat'),
  person('self', 'Sam'),
  person('spouse', 'Alex'),
  person('child', 'Chris'),
  person('stranger', 'Una'),
];

const relationships = [
  rel('r-parent', 'parent-child', 'parent', 'self'),
  rel('r-spouse', 'spouse', 'self', 'spouse'),
  rel('r-child', 'parent-child', 'self', 'child'),
];

describe('layoutFamilyTree', () => {
  it('places parents above the root, children below, and a spouse on the same row', () => {
    const { nodes, links } = layoutFamilyTree(persons, relationships, 'self');
    const byId = new Map(nodes.map((node) => [node.person.id, node]));

    const root = byId.get('self');
    const parent = byId.get('parent');
    const spouse = byId.get('spouse');
    const child = byId.get('child');

    expect(root).toBeDefined();
    expect(parent!.generation).toBeLessThan(root!.generation);
    expect(parent!.y).toBeLessThan(root!.y);
    expect(child!.generation).toBeGreaterThan(root!.generation);
    expect(child!.y).toBeGreaterThan(root!.y);
    expect(spouse!.generation).toBe(root!.generation);
    expect(spouse!.y).toBe(root!.y);
    // NODE_WIDTH 200 + COUPLE_GAP 10; spouses sit immediately beside the root.
    expect(spouse!.x - root!.x).toBe(210);

    expect(links.some((link) => link.type === 'spouse')).toBe(true);
    expect(links.some((link) => link.type === 'parent-child')).toBe(true);
  });

  it('returns no nodes for an empty tree', () => {
    expect(layoutFamilyTree([], [], 'self')).toEqual({ nodes: [], links: [] });
  });
});

describe('calculateRelationship', () => {
  it('labels the core family links used while building a tree', () => {
    expect(calculateRelationship('self', 'parent', persons, relationships)).toBe('Parent');
    expect(calculateRelationship('self', 'child', persons, relationships)).toBe('Child');
    expect(calculateRelationship('self', 'spouse', persons, relationships)).toBe('Spouse');
    expect(calculateRelationship('self', 'stranger', persons, relationships)).toBe(
      'Not related'
    );
    expect(calculateRelationship('self', 'self', persons, relationships)).toBe('Same person');
  });
});
