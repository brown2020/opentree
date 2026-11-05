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
const LEVEL_HEIGHT = NODE_HEIGHT + V_GAP;

type AdjMap = ReturnType<typeof buildAdjacencyMap>;
type Point = { x: number; y: number };

/**
 * Layout a family tree centered on a root person.
 * Parents above, children below, spouses side-by-side.
 * Each connected family is laid out on its own, then placed so cards never share space.
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
  const components = orderComponents(
    connectedComponents(personIds, adj),
    rootPersonId
  );

  const positions = new Map<string, Point>();
  const generations = new Map<string, number>();
  let nextLeft = 0;

  components.forEach((component, index) => {
    const localRoot = component.includes(rootPersonId)
      ? rootPersonId
      : component[0];
    const local = layoutComponent(component, adj, localRoot);
    for (const [id, gen] of local.generations) generations.set(id, gen);

    const shift = index === 0 ? 0 : nextLeft - extent(local.positions).minLeft;
    let maxRight = -Infinity;
    for (const [id, pos] of local.positions) {
      const x = pos.x + shift;
      positions.set(id, { x, y: pos.y });
      maxRight = Math.max(maxRight, x + NODE_WIDTH / 2);
    }
    nextLeft = maxRight + H_GAP;
  });

  separateOverlappingRows(positions, adj);

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

  const links = buildLinks(relationships, positions);
  return { nodes, links };
}

function layoutComponent(
  ids: string[],
  adj: AdjMap,
  rootId: string
): { positions: Map<string, Point>; generations: Map<string, number> } {
  const generations = assignGenerations(ids, adj, rootId);
  const genGroups = new Map<number, string[]>();
  for (const [personId, gen] of generations) {
    const row = genGroups.get(gen);
    if (row) row.push(personId);
    else genGroups.set(gen, [personId]);
  }
  for (const [gen, row] of genGroups) {
    genGroups.set(gen, orderGeneration(row, adj, rootId, gen));
  }

  const positions = new Map<string, Point>();
  for (const gen of [...genGroups.keys()].sort((a, b) => a - b)) {
    placeGeneration(genGroups.get(gen) ?? [], gen, adj, positions);
  }

  separateOverlappingRows(positions, adj);

  const rootPos = positions.get(rootId);
  if (rootPos) {
    const dx = -rootPos.x;
    for (const pos of positions.values()) pos.x += dx;
  }

  return { positions, generations };
}

function assignGenerations(
  ids: string[],
  adj: AdjMap,
  rootId: string
): Map<string, number> {
  const idSet = new Set(ids);
  const generations = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; gen: number }[] = [];
  const start = idSet.has(rootId) ? rootId : ids[0];
  if (start) queue.push({ id: start, gen: 0 });

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    if (visited.has(id) || !idSet.has(id)) continue;
    visited.add(id);
    generations.set(id, gen);

    const entry = adj.get(id);
    if (!entry) continue;

    for (const spouseId of entry.spouses) {
      if (!visited.has(spouseId)) queue.push({ id: spouseId, gen });
    }
    for (const parentId of entry.parents) {
      if (!visited.has(parentId)) queue.push({ id: parentId, gen: gen - 1 });
    }
    for (const childId of entry.children) {
      if (!visited.has(childId)) queue.push({ id: childId, gen: gen + 1 });
    }
  }

  for (const id of ids) {
    if (!generations.has(id)) generations.set(id, 0);
  }
  return generations;
}

interface RowUnit {
  members: string[];
  width: number;
  desiredCenter: number | null;
  left: number;
}

function placeGeneration(
  ids: string[],
  gen: number,
  adj: AdjMap,
  positions: Map<string, Point>
): void {
  const units = rowUnits(ids, adj, positions);
  const anchored = units
    .filter((unit) => unit.desiredCenter !== null)
    .sort((a, b) => (a.desiredCenter ?? 0) - (b.desiredCenter ?? 0));
  const floating = units.filter((unit) => unit.desiredCenter === null);

  let cursor = Number.NEGATIVE_INFINITY;
  for (const unit of [...anchored, ...floating]) {
    let left =
      unit.desiredCenter === null ? 0 : unit.desiredCenter - unit.width / 2;
    if (cursor !== Number.NEGATIVE_INFINITY && left < cursor) left = cursor;
    if (cursor === Number.NEGATIVE_INFINITY && unit.desiredCenter === null) {
      left = 0;
    }
    unit.left = left;
    cursor = left + unit.width + H_GAP;
  }

  const y = gen * LEVEL_HEIGHT;
  for (const unit of units) {
    let x = unit.left;
    for (let i = 0; i < unit.members.length; i++) {
      const personId = unit.members[i];
      positions.set(personId, { x: x + NODE_WIDTH / 2, y });
      const isCouple = areSpouses(adj, personId, unit.members[i + 1]);
      x += NODE_WIDTH + (isCouple ? COUPLE_GAP : H_GAP);
    }
  }
}

function rowUnits(
  ids: string[],
  adj: AdjMap,
  positions: Map<string, Point>
): RowUnit[] {
  const idSet = new Set(ids);
  const placed = new Set<string>();
  const siblingGroups = new Map<string, string[]>();

  for (const id of ids) {
    const parents = (adj.get(id)?.parents ?? [])
      .filter((parentId) => positions.has(parentId))
      .sort();
    if (parents.length === 0) continue;
    const key = parents.join('|');
    const group = siblingGroups.get(key);
    if (group) group.push(id);
    else siblingGroups.set(key, [id]);
  }

  const units: RowUnit[] = [];

  const addUnit = (seeds: string[], desiredCenter: number | null) => {
    const members = expandUnit(seeds, idSet, placed, ids, adj);
    if (members.length === 0) return;
    units.push({
      members,
      width: unitWidth(members, adj),
      desiredCenter,
      left: 0,
    });
  };

  for (const [key, siblings] of siblingGroups) {
    const parentXs = key
      .split('|')
      .map((parentId) => positions.get(parentId)?.x)
      .filter((x): x is number => x !== undefined);
    const desiredCenter =
      parentXs.length > 0
        ? parentXs.reduce((sum, x) => sum + x, 0) / parentXs.length
        : null;
    addUnit(siblings, desiredCenter);
  }

  for (const id of ids) addUnit([id], null);

  return units;
}

function expandUnit(
  seeds: string[],
  idSet: Set<string>,
  placed: Set<string>,
  order: string[],
  adj: AdjMap
): string[] {
  const members: string[] = [];
  const queue = [...seeds];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (!idSet.has(id) || placed.has(id)) continue;
    placed.add(id);
    members.push(id);
    for (const spouseId of adj.get(id)?.spouses ?? []) {
      if (idSet.has(spouseId) && !placed.has(spouseId)) queue.push(spouseId);
    }
  }
  const rank = new Map(order.map((id, index) => [id, index]));
  members.sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  return members;
}

function unitWidth(members: string[], adj: AdjMap): number {
  let width = 0;
  for (let i = 0; i < members.length; i++) {
    width += NODE_WIDTH;
    if (i < members.length - 1) {
      const isCouple = areSpouses(adj, members[i], members[i + 1]);
      width += isCouple ? COUPLE_GAP : H_GAP;
    }
  }
  return width;
}

function separateOverlappingRows(
  positions: Map<string, Point>,
  adj: AdjMap
): void {
  const rows = new Map<number, string[]>();
  for (const [id, pos] of positions) {
    const row = rows.get(pos.y);
    if (row) row.push(id);
    else rows.set(pos.y, [id]);
  }

  for (const ids of rows.values()) {
    ids.sort(
      (a, b) => (positions.get(a)?.x ?? 0) - (positions.get(b)?.x ?? 0)
    );
    for (let i = 1; i < ids.length; i++) {
      const prev = positions.get(ids[i - 1]);
      const current = positions.get(ids[i]);
      if (!prev || !current) continue;
      const couple =
        areSpouses(adj, ids[i - 1], ids[i]) ||
        areSpouses(adj, ids[i], ids[i - 1]);
      const minCenter = prev.x + NODE_WIDTH + (couple ? COUPLE_GAP : H_GAP);
      if (current.x < minCenter) current.x = minCenter;
    }
  }
}

function buildLinks(
  relationships: Relationship[],
  positions: Map<string, Point>
): TreeLink[] {
  const links: TreeLink[] = [];
  for (const rel of relationships) {
    const p1 = positions.get(rel.person1Id);
    const p2 = positions.get(rel.person2Id);
    if (!p1 || !p2) continue;

    if (rel.type === 'spouse' || Math.abs(p1.y - p2.y) < 1) {
      const left = p1.x <= p2.x ? p1 : p2;
      const right = left === p1 ? p2 : p1;
      links.push({
        from: { x: left.x + NODE_WIDTH / 2, y: left.y + NODE_HEIGHT / 2 },
        to: { x: right.x - NODE_WIDTH / 2, y: right.y + NODE_HEIGHT / 2 },
        type: rel.type === 'spouse' ? 'spouse' : 'parent-child',
      });
      continue;
    }

    const upper = p1.y <= p2.y ? p1 : p2;
    const lower = upper === p1 ? p2 : p1;
    links.push({
      from: { x: upper.x, y: upper.y + NODE_HEIGHT },
      to: { x: lower.x, y: lower.y },
      type: 'parent-child',
    });
  }
  return links;
}

function connectedComponents(ids: string[], adj: AdjMap): string[][] {
  const remaining = new Set(ids);
  const components: string[][] = [];

  for (const start of ids) {
    if (!remaining.has(start)) continue;
    const component: string[] = [];
    const queue = [start];
    remaining.delete(start);
    while (queue.length > 0) {
      const id = queue.shift()!;
      component.push(id);
      const entry = adj.get(id);
      if (!entry) continue;
      for (const nextId of [
        ...entry.parents,
        ...entry.children,
        ...entry.spouses,
      ]) {
        if (!remaining.has(nextId)) continue;
        remaining.delete(nextId);
        queue.push(nextId);
      }
    }
    components.push(component);
  }

  return components;
}

function orderComponents(components: string[][], rootId: string): string[][] {
  const index = components.findIndex((component) => component.includes(rootId));
  if (index <= 0) return components;
  return [
    components[index],
    ...components.filter((_, componentIndex) => componentIndex !== index),
  ];
}

function extent(positions: Map<string, Point>): {
  minLeft: number;
  maxRight: number;
} {
  let minLeft = Infinity;
  let maxRight = -Infinity;
  for (const pos of positions.values()) {
    minLeft = Math.min(minLeft, pos.x - NODE_WIDTH / 2);
    maxRight = Math.max(maxRight, pos.x + NODE_WIDTH / 2);
  }
  return { minLeft, maxRight };
}

function areSpouses(adj: AdjMap, a: string, b: string | undefined): boolean {
  if (!b) return false;
  const spouses = adj.get(a)?.spouses;
  if (!spouses) return false;
  for (let i = 0; i < spouses.length; i++) {
    if (spouses[i] === b) return true;
  }
  return false;
}

function orderGeneration(
  ids: string[],
  adj: AdjMap,
  rootId: string,
  gen: number
): string[] {
  if (ids.length <= 1) return ids;

  const idSet = new Set(ids);
  const placed = new Set<string>();
  const ordered: string[] = [];

  if (gen === 0 && idSet.has(rootId)) {
    placed.add(rootId);
    ordered.push(rootId);

    const rootAdj = adj.get(rootId);
    if (rootAdj) {
      for (const spouseId of rootAdj.spouses) {
        if (idSet.has(spouseId) && !placed.has(spouseId)) {
          placed.add(spouseId);
          ordered.push(spouseId);
        }
      }
    }
  }

  for (const id of ids) {
    if (placed.has(id)) continue;
    placed.add(id);
    ordered.push(id);

    const entry = adj.get(id);
    if (entry) {
      for (const spouseId of entry.spouses) {
        if (idSet.has(spouseId) && !placed.has(spouseId)) {
          placed.add(spouseId);
          ordered.push(spouseId);
        }
      }
    }
  }

  return ordered;
}

export { NODE_WIDTH, NODE_HEIGHT };
