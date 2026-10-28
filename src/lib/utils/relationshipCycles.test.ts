import { describe, expect, it } from 'vitest';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';
import { relationshipCycleMessage } from './relationshipCycles';
import type { Relationship } from '@/lib/types';

function parentChild(parentId: string, childId: string): Relationship {
  return {
    id: `${parentId}-${childId}`,
    type: 'parent-child',
    person1Id: parentId,
    person2Id: childId,
    marriageDate: null,
    divorceDate: null,
    createdAt: null as unknown as Relationship['createdAt'],
  };
}

const ids = ['a', 'b', 'c', 'd'];
const adj = buildAdjacencyMap(ids, [
  parentChild('a', 'b'),
  parentChild('b', 'c'),
]);

describe('relationshipCycleMessage', () => {
  it('blocks adding a descendant as a parent', () => {
    const message = relationshipCycleMessage({
      action: 'add-parent',
      personId: 'a',
      personName: 'Ada',
      selectedId: 'c',
      selectedName: 'Cora',
      adj,
    });
    expect(message).toMatch(/Cora is already a descendant of Ada/);
  });

  it('blocks adding an ancestor as a child', () => {
    const message = relationshipCycleMessage({
      action: 'add-child',
      personId: 'c',
      personName: 'Cora',
      selectedId: 'a',
      selectedName: 'Ada',
      adj,
    });
    expect(message).toMatch(/Cora is already a descendant of Ada/);
  });

  it('allows a parent who is not already a descendant', () => {
    expect(
      relationshipCycleMessage({
        action: 'add-parent',
        personId: 'a',
        personName: 'Ada',
        selectedId: 'd',
        selectedName: 'Dee',
        adj,
      })
    ).toBeNull();
  });
});
