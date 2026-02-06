import type { Person, Relationship } from '@/lib/types';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';

interface PathStep {
  personId: string;
  via: 'parent' | 'child' | 'spouse';
}

/**
 * Find the relationship path between two persons using BFS.
 */
function findPath(
  fromId: string,
  toId: string,
  adj: ReturnType<typeof buildAdjacencyMap>
): PathStep[] | null {
  if (fromId === toId) return [];

  const visited = new Set<string>();
  const queue: { id: string; path: PathStep[] }[] = [
    { id: fromId, path: [] },
  ];

  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const entry = adj.get(id);
    if (!entry) continue;

    // Try parents
    for (const parentId of entry.parents) {
      if (parentId === toId) {
        return [...path, { personId: parentId, via: 'parent' }];
      }
      if (!visited.has(parentId)) {
        queue.push({
          id: parentId,
          path: [...path, { personId: parentId, via: 'parent' }],
        });
      }
    }

    // Try children
    for (const childId of entry.children) {
      if (childId === toId) {
        return [...path, { personId: childId, via: 'child' }];
      }
      if (!visited.has(childId)) {
        queue.push({
          id: childId,
          path: [...path, { personId: childId, via: 'child' }],
        });
      }
    }

    // Try spouses
    for (const spouseId of entry.spouses) {
      if (spouseId === toId) {
        return [...path, { personId: spouseId, via: 'spouse' }];
      }
      if (!visited.has(spouseId)) {
        queue.push({
          id: spouseId,
          path: [...path, { personId: spouseId, via: 'spouse' }],
        });
      }
    }
  }

  return null;
}

/**
 * Calculate the relationship label between two persons.
 */
export function calculateRelationship(
  person1Id: string,
  person2Id: string,
  persons: Person[],
  relationships: Relationship[]
): string {
  const personIds = persons.map((p) => p.id);
  const adj = buildAdjacencyMap(personIds, relationships);

  const path = findPath(person1Id, person2Id, adj);
  if (!path) return 'Not related';
  if (path.length === 0) return 'Same person';

  // Count up-steps (parent) and down-steps (child)
  let ups = 0;
  let downs = 0;
  let hasSpouse = false;

  for (const step of path) {
    if (step.via === 'parent') ups++;
    else if (step.via === 'child') downs++;
    else if (step.via === 'spouse') hasSpouse = true;
  }

  // Direct spouse
  if (path.length === 1 && hasSpouse) return 'Spouse';

  // Direct parent/child
  if (ups === 1 && downs === 0 && !hasSpouse) return 'Parent';
  if (ups === 0 && downs === 1 && !hasSpouse) return 'Child';

  // Siblings: up 1, down 1
  if (ups === 1 && downs === 1 && !hasSpouse) return 'Sibling';

  // Grandparent/grandchild
  if (ups === 2 && downs === 0 && !hasSpouse) return 'Grandparent';
  if (ups === 0 && downs === 2 && !hasSpouse) return 'Grandchild';

  // Great-grandparent/great-grandchild
  if (ups >= 3 && downs === 0 && !hasSpouse) {
    const greats = ups - 2;
    return `${'Great-'.repeat(greats)}Grandparent`;
  }
  if (ups === 0 && downs >= 3 && !hasSpouse) {
    const greats = downs - 2;
    return `${'Great-'.repeat(greats)}Grandchild`;
  }

  // Uncle/Aunt/Nephew/Niece: up 2, down 1 or up 1, down 2
  if (ups === 2 && downs === 1 && !hasSpouse) return 'Uncle/Aunt';
  if (ups === 1 && downs === 2 && !hasSpouse) return 'Nephew/Niece';

  // Cousins
  if (ups > 0 && downs > 0 && !hasSpouse) {
    const minGen = Math.min(ups, downs);
    const removed = Math.abs(ups - downs);

    if (minGen === 1 && removed > 1) {
      return removed === 2
        ? 'Great Uncle/Aunt or Great Nephew/Niece'
        : `${ordinal(removed - 1)} Great Uncle/Aunt or Great Nephew/Niece`;
    }

    if (removed === 0) {
      return `${ordinal(minGen - 1)} Cousin`;
    }

    return `${ordinal(Math.min(ups, downs) - 1)} Cousin, ${removed}x removed`;
  }

  // In-law relationships (path includes a spouse step)
  if (hasSpouse) {
    if (ups === 1 && path.some((s) => s.via === 'spouse')) {
      return 'Parent-in-law';
    }
    if (downs === 1 && path.some((s) => s.via === 'spouse')) {
      return 'Child-in-law';
    }
    if (ups === 1 && downs === 1) {
      return 'Sibling-in-law';
    }
    return 'Related by marriage';
  }

  return `Related (${ups} generations up, ${downs} generations down)`;
}

function ordinal(n: number): string {
  if (n <= 0) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
