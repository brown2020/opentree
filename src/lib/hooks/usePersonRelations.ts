import { useMemo } from 'react';
import { format } from 'date-fns';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';
import { timestampToDate } from '@/lib/firebase/firestore';
import type { Person, Relationship } from '@/lib/types';

export function usePersonRelations(
  person: Person | null | undefined,
  persons: Person[],
  relationships: Relationship[],
) {
  const related = useMemo(() => {
    const empty = {
      parents: [] as Person[],
      children: [] as Person[],
      spouses: [] as Person[],
      siblings: [] as Person[],
      stepParents: [] as Person[],
      stepChildren: [] as Person[],
      stepSiblings: [] as Person[],
    };

    if (!person || persons.length === 0) return empty;

    const personIds = persons.map((p) => p.id);
    const adj = buildAdjacencyMap(personIds, relationships);
    const entry = adj.get(person.id);
    if (!entry) return empty;

    const personMap = new Map(persons.map((p) => [p.id, p]));
    const resolve = (ids: string[]) =>
      ids.map((id) => personMap.get(id)).filter((p): p is Person => !!p);

    const parentsList = resolve(entry.parents);
    const childrenList = resolve(entry.children);
    const spousesList = resolve(entry.spouses);

    const siblingIds = new Set<string>();
    for (const parentId of entry.parents) {
      const parentEntry = adj.get(parentId);
      if (parentEntry) {
        for (const childId of parentEntry.children) {
          if (childId !== person.id) siblingIds.add(childId);
        }
      }
    }

    const parentIdSet = new Set(entry.parents);
    const childIdSet = new Set(entry.children);

    const stepParentIds = new Set<string>();
    for (const parentId of entry.parents) {
      const parentEntry = adj.get(parentId);
      if (parentEntry) {
        for (const spouseId of parentEntry.spouses) {
          if (!parentIdSet.has(spouseId)) {
            stepParentIds.add(spouseId);
          }
        }
      }
    }

    const stepChildIds = new Set<string>();
    for (const spouseId of entry.spouses) {
      const spouseEntry = adj.get(spouseId);
      if (spouseEntry) {
        for (const childId of spouseEntry.children) {
          if (!childIdSet.has(childId)) {
            stepChildIds.add(childId);
          }
        }
      }
    }

    const stepSiblingIds = new Set<string>();
    for (const stepParentId of stepParentIds) {
      const stepParentEntry = adj.get(stepParentId);
      if (stepParentEntry) {
        for (const childId of stepParentEntry.children) {
          if (childId !== person.id && !siblingIds.has(childId)) {
            stepSiblingIds.add(childId);
          }
        }
      }
    }

    return {
      parents: parentsList,
      children: childrenList,
      spouses: spousesList,
      siblings: resolve([...siblingIds]),
      stepParents: resolve([...stepParentIds]),
      stepChildren: resolve([...stepChildIds]),
      stepSiblings: resolve([...stepSiblingIds]),
    };
  }, [person, persons, relationships]);

  const marriageDates = useMemo(() => {
    if (!person) return new Map<string, string>();
    const dates = new Map<string, string>();
    for (const rel of relationships) {
      if (rel.type !== 'spouse') continue;
      const spouseId = rel.person1Id === person.id ? rel.person2Id
        : rel.person2Id === person.id ? rel.person1Id : null;
      if (!spouseId || !rel.marriageDate) continue;
      const d = timestampToDate(rel.marriageDate);
      if (d) dates.set(spouseId, format(d, 'MMMM d, yyyy'));
    }
    return dates;
  }, [person, relationships]);


  return { related, marriageDates };
}
