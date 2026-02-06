import type { Person, Relationship } from '@/lib/types';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';

export interface PositionedNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

export interface TreeLink {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'parent-child' | 'spouse';
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 90;
const H_GAP = 30;
const V_GAP = 120;
const COUPLE_GAP = 10;
// Slot width used for rough positioning calculations
// const SLOT_WIDTH = NODE_WIDTH + H_GAP;

/**
 * Layout a family tree centered on a root person.
 * Parents above, children below, spouses side-by-side.
 */
export function layoutFamilyTree(
  persons: Person[],
  relationships: Relationship[],
  rootPersonId: string
): { nodes: PositionedNode[]; links: TreeLink[] } {
  if (persons.length === 0) return { nodes: [], links: [] };

  const personMap = new Map(persons.map((p) => [p.id, p]));
  const personIds = persons.map((p) => p.id);
  const adj = buildAdjacencyMap(personIds, relationships);

  // Step 1: Assign generations via BFS from root
  const generations = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; gen: number }[] = [
    { id: rootPersonId, gen: 0 },
  ];

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    generations.set(id, gen);

    const entry = adj.get(id);
    if (!entry) continue;

    // Spouses at same generation
    for (const spouseId of entry.spouses) {
      if (!visited.has(spouseId)) {
        queue.push({ id: spouseId, gen });
      }
    }

    // Parents one generation up
    for (const parentId of entry.parents) {
      if (!visited.has(parentId)) {
        queue.push({ id: parentId, gen: gen - 1 });
      }
    }

    // Children one generation down
    for (const childId of entry.children) {
      if (!visited.has(childId)) {
        queue.push({ id: childId, gen: gen + 1 });
      }
    }
  }

  // Include unconnected persons at generation 0
  for (const p of persons) {
    if (!generations.has(p.id)) {
      generations.set(p.id, 0);
    }
  }

  // Step 2: Group by generation
  const genGroups = new Map<number, string[]>();
  for (const [personId, gen] of generations) {
    if (!genGroups.has(gen)) genGroups.set(gen, []);
    genGroups.get(gen)!.push(personId);
  }

  // Step 3: Order persons within each generation — keep couples adjacent
  for (const [gen, ids] of genGroups) {
    const ordered = orderGeneration(ids, adj, rootPersonId, gen);
    genGroups.set(gen, ordered);
  }

  // Step 4: Compute positions
  const positions = new Map<string, { x: number; y: number }>();
  const sortedGens = [...genGroups.keys()].sort((a, b) => a - b);

  for (const gen of sortedGens) {
    const ids = genGroups.get(gen)!;
    const totalWidth = computeRowWidth(ids, adj);
    let x = -totalWidth / 2;
    const y = gen * (NODE_HEIGHT + V_GAP);

    for (let i = 0; i < ids.length; i++) {
      const personId = ids[i];
      positions.set(personId, { x: x + NODE_WIDTH / 2, y });

      // Check if next person is a spouse (use smaller gap)
      const entry = adj.get(personId);
      const nextId = ids[i + 1];
      const isCouple = nextId && entry?.spouses.includes(nextId);

      x += NODE_WIDTH + (isCouple ? COUPLE_GAP : H_GAP);
    }
  }

  // Step 5: Center children under their parents
  centerChildrenUnderParents(genGroups, sortedGens, adj, positions);

  // Step 6: Build positioned nodes
  const nodes: PositionedNode[] = [];
  for (const [personId, pos] of positions) {
    const person = personMap.get(personId);
    if (!person) continue;
    nodes.push({
      person,
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y,
      generation: generations.get(personId) ?? 0,
    });
  }

  // Step 7: Build links
  const links: TreeLink[] = [];
  for (const rel of relationships) {
    const p1 = positions.get(rel.person1Id);
    const p2 = positions.get(rel.person2Id);
    if (!p1 || !p2) continue;

    if (rel.type === 'spouse') {
      // Horizontal line at mid-height
      links.push({
        from: { x: p1.x, y: p1.y + NODE_HEIGHT / 2 },
        to: { x: p2.x, y: p2.y + NODE_HEIGHT / 2 },
        type: 'spouse',
      });
    } else {
      // parent (person1) → child (person2) vertical
      links.push({
        from: { x: p1.x, y: p1.y + NODE_HEIGHT },
        to: { x: p2.x, y: p2.y },
        type: 'parent-child',
      });
    }
  }

  return { nodes, links };
}

function computeRowWidth(
  ids: string[],
  adj: ReturnType<typeof buildAdjacencyMap>
): number {
  let width = 0;
  for (let i = 0; i < ids.length; i++) {
    width += NODE_WIDTH;
    if (i < ids.length - 1) {
      const entry = adj.get(ids[i]);
      const isCouple = entry?.spouses.includes(ids[i + 1]);
      width += isCouple ? COUPLE_GAP : H_GAP;
    }
  }
  return width;
}

function orderGeneration(
  ids: string[],
  adj: ReturnType<typeof buildAdjacencyMap>,
  rootId: string,
  gen: number
): string[] {
  if (ids.length <= 1) return ids;

  // Group couples together
  const placed = new Set<string>();
  const ordered: string[] = [];

  // If root person is in this generation, start with them
  if (gen === 0 && ids.includes(rootId)) {
    placed.add(rootId);
    ordered.push(rootId);

    // Add root's spouse(s) immediately after
    const rootAdj = adj.get(rootId);
    if (rootAdj) {
      for (const spouseId of rootAdj.spouses) {
        if (ids.includes(spouseId) && !placed.has(spouseId)) {
          placed.add(spouseId);
          ordered.push(spouseId);
        }
      }
    }
  }

  // Add remaining persons, grouping couples
  for (const id of ids) {
    if (placed.has(id)) continue;
    placed.add(id);
    ordered.push(id);

    const entry = adj.get(id);
    if (entry) {
      for (const spouseId of entry.spouses) {
        if (ids.includes(spouseId) && !placed.has(spouseId)) {
          placed.add(spouseId);
          ordered.push(spouseId);
        }
      }
    }
  }

  return ordered;
}

function centerChildrenUnderParents(
  genGroups: Map<number, string[]>,
  sortedGens: number[],
  adj: ReturnType<typeof buildAdjacencyMap>,
  positions: Map<string, { x: number; y: number }>
): void {
  // For each generation (top to bottom), center children under parents
  for (const gen of sortedGens) {
    const ids = genGroups.get(gen)!;

    // Find unique parent-pairs for this generation's children
    const parentCenterMap = new Map<string, number>();

    for (const id of ids) {
      const entry = adj.get(id);
      if (!entry) continue;

      // Get parent positions
      const parentPositions = entry.parents
        .map((pid) => positions.get(pid)?.x)
        .filter((x): x is number => x !== undefined);

      if (parentPositions.length > 0) {
        const centerX =
          parentPositions.reduce((sum, x) => sum + x, 0) /
          parentPositions.length;
        parentCenterMap.set(id, centerX);
      }
    }

    if (parentCenterMap.size === 0) continue;

    // Group children by their parent-pair
    const siblingGroups = new Map<string, string[]>();
    for (const id of ids) {
      const entry = adj.get(id);
      if (!entry || entry.parents.length === 0) continue;

      const parentKey = [...entry.parents].sort().join('-');
      if (!siblingGroups.has(parentKey)) siblingGroups.set(parentKey, []);
      siblingGroups.get(parentKey)!.push(id);
    }

    // Shift each sibling group to center under parents
    for (const [, siblings] of siblingGroups) {
      if (siblings.length === 0) continue;

      const childPositions = siblings
        .map((id) => positions.get(id)?.x)
        .filter((x): x is number => x !== undefined);

      if (childPositions.length === 0) continue;

      const childCenter =
        childPositions.reduce((sum, x) => sum + x, 0) /
        childPositions.length;

      // Find parent center for this group
      const firstChild = siblings[0];
      const parentCenter = parentCenterMap.get(firstChild);
      if (parentCenter === undefined) continue;

      const shift = parentCenter - childCenter;
      for (const id of siblings) {
        const pos = positions.get(id);
        if (pos) {
          pos.x += shift;

          // Also shift their spouses
          const entry = adj.get(id);
          if (entry) {
            for (const spouseId of entry.spouses) {
              const spousePos = positions.get(spouseId);
              const spouseEntry = adj.get(spouseId);
              // Only shift if spouse's parents aren't in a different group
              if (
                spousePos &&
                spouseEntry &&
                spouseEntry.parents.length === 0
              ) {
                spousePos.x += shift;
              }
            }
          }
        }
      }
    }
  }
}

export { NODE_WIDTH, NODE_HEIGHT, H_GAP, V_GAP };
