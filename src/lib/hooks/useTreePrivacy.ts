'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  canViewFullPerson,
  getPersonForViewer,
  getPersonLifespanLabel,
  preparePersonsForViewer,
} from '@/lib/utils/personPrivacy';
import type { Person, Tree, TreeMember } from '@/lib/types';

export function useTreePrivacy(
  tree: Tree | null | undefined,
  members: TreeMember[] = []
) {
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const canViewFull = useCallback(
    (person: Person) => canViewFullPerson(tree, person, userId, members),
    [tree, userId, members]
  );

  const getDisplayPerson = useCallback(
    (person: Person) => getPersonForViewer(person, tree, userId, members),
    [tree, userId, members]
  );

  const getLifespanLabel = useCallback(
    (person: Person) => getPersonLifespanLabel(person, canViewFull(person)),
    [canViewFull]
  );

  const getDisplayPersons = useCallback(
    (persons: Person[]) =>
      preparePersonsForViewer(persons, tree, userId, members),
    [tree, userId, members]
  );

  return {
    canViewFullPerson: canViewFull,
    getDisplayPerson,
    getDisplayPersons,
    getLifespanLabel,
  };
}
