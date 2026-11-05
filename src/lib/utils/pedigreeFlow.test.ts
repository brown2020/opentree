import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  layoutFamilyTree,
  NODE_HEIGHT,
  NODE_WIDTH,
  type PositionedNode,
  type TreeLink,
} from './familyTreeLayout';
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
    // NODE_WIDTH 200 + COUPLE_GAP 36. The open gap is the spouse connector.
    expect(spouse!.x - root!.x).toBe(236);
    const spouseLink = links.find((link) => link.type === 'spouse');
    expect(spouseLink).toBeDefined();
    expect(spouseLink!.to.x - spouseLink!.from.x).toBe(36);

    expect(links.some((link) => link.type === 'spouse')).toBe(true);
    expect(links.some((link) => link.type === 'parent-child')).toBe(true);
    expect(overlappingNames(nodes)).toEqual([]);
    expect(links.filter((link) => linkIsHidden(link, nodes))).toEqual([]);
  });

  it('returns no nodes for an empty tree', () => {
    expect(layoutFamilyTree([], [], 'self')).toEqual({ nodes: [], links: [] });
  });

  it('keeps a parent and two children from covering each other and draws both links', () => {
    const family = [
      person('annie', 'Annie'),
      person('bob', 'Bob'),
      person('carol', 'Carol'),
    ];
    const rels = [
      rel('annie-bob', 'parent-child', 'annie', 'bob'),
      rel('annie-carol', 'parent-child', 'annie', 'carol'),
    ];

    const { nodes, links } = layoutFamilyTree(family, rels, 'annie');
    const byName = new Map(nodes.map((node) => [node.person.firstName, node]));
    const annie = byName.get('Annie')!;
    const bob = byName.get('Bob')!;
    const carol = byName.get('Carol')!;

    expect(overlappingNames(nodes)).toEqual([]);
    expect(bob.y).toBeGreaterThan(annie.y + NODE_HEIGHT);
    expect(carol.y).toBeGreaterThan(annie.y + NODE_HEIGHT);
    expect(Math.abs(bob.x - carol.x)).toBeGreaterThanOrEqual(NODE_WIDTH);
    expect(links).toHaveLength(rels.length);
    expect(links.every((link) => link.type === 'parent-child')).toBe(true);
    expect(links.filter((link) => linkIsHidden(link, nodes))).toEqual([]);
  });

  it('does not hide Annie behind Bob and Carol when the centered id is outside the family', () => {
    const family = [
      person('annie', 'Annie'),
      person('bob', 'Bob'),
      person('carol', 'Carol'),
    ];
    const rels = [
      rel('annie-bob', 'parent-child', 'annie', 'bob'),
      rel('annie-carol', 'parent-child', 'annie', 'carol'),
    ];

    const { nodes, links } = layoutFamilyTree(family, rels, 'missing-root');

    expect(overlappingNames(nodes)).toEqual([]);
    expect(links).toHaveLength(2);
    expect(links.filter((link) => linkIsHidden(link, nodes))).toEqual([]);
  });

  it('keeps half-siblings from landing on the shared child', () => {
    const family = [
      person('bob', 'Bob'),
      person('carol', 'Carol'),
      person('annie', 'Annie'),
      person('dan', 'Dan'),
      person('eve', 'Eve'),
    ];
    const rels = [
      rel('spouses', 'spouse', 'bob', 'carol'),
      rel('annie-bob', 'parent-child', 'bob', 'annie'),
      rel('annie-carol', 'parent-child', 'carol', 'annie'),
      rel('dan-bob', 'parent-child', 'bob', 'dan'),
      rel('eve-carol', 'parent-child', 'carol', 'eve'),
    ];

    const { nodes, links } = layoutFamilyTree(family, rels, 'bob');

    expect(overlappingNames(nodes)).toEqual([]);
    expect(links).toHaveLength(rels.length);
    expect(links.filter((link) => linkIsHidden(link, nodes))).toEqual([]);
  });
});

function overlappingNames(nodes: PositionedNode[]): string[] {
  const names: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const separated =
        a.x + NODE_WIDTH <= b.x ||
        b.x + NODE_WIDTH <= a.x ||
        a.y + NODE_HEIGHT <= b.y ||
        b.y + NODE_HEIGHT <= a.y;
      if (!separated) {
        names.push(`${a.person.firstName}/${b.person.firstName}`);
      }
    }
  }
  return names;
}

function linkIsHidden(link: TreeLink, nodes: PositionedNode[]): boolean {
  if (link.from.x === link.to.x && link.from.y === link.to.y) return true;
  const x = (link.from.x + link.to.x) / 2;
  const y = (link.from.y + link.to.y) / 2;
  return nodes.some(
    (node) =>
      x > node.x &&
      x < node.x + NODE_WIDTH &&
      y > node.y &&
      y < node.y + NODE_HEIGHT
  );
}

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
