import { buildAdjacencyMap } from '@/lib/firebase/relationships';

type Adjacency = ReturnType<typeof buildAdjacencyMap>;

/**
 * True when ancestorId appears in personId's parent chain.
 */
export function isAncestor(
  ancestorId: string,
  personId: string,
  adj: Adjacency
): boolean {
  const visited = new Set<string>();
  const queue = [personId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    const entry = adj.get(current);
    if (!entry) continue;

    for (const parentId of entry.parents) {
      if (parentId === ancestorId) return true;
      if (!visited.has(parentId)) queue.push(parentId);
    }
  }

  return false;
}

/**
 * Block a parent/child link that would make someone their own descendant.
 * Spouse links are not checked here.
 */
export function relationshipCycleMessage(options: {
  action: 'add-parent' | 'add-child' | 'add-spouse';
  personId: string;
  personName: string;
  selectedId: string;
  selectedName: string;
  adj: Adjacency;
}): string | null {
  const { action, personId, personName, selectedId, selectedName, adj } = options;

  if (action === 'add-parent' && isAncestor(personId, selectedId, adj)) {
    return `Cannot add: ${selectedName} is already a descendant of ${personName}. This would create a loop.`;
  }

  if (action === 'add-child' && isAncestor(selectedId, personId, adj)) {
    return `Cannot add: ${personName} is already a descendant of ${selectedName}. This would create a loop.`;
  }

  return null;
}
