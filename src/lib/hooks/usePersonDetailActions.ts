'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPerson } from '@/lib/firebase/firestore';
import { addRelationship as addRelationshipFn } from '@/lib/firebase/relationships';
import type { Person, RelationshipType } from '@/lib/types';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

type PersonTab = 'overview' | 'photos' | 'documents' | 'timeline';

export function usePersonDetailActions(opts: {
  treeId: string | null;
  personId: string;
  person: Person | null | undefined;
  addRel: (type: RelationshipType, a: string, b: string) => Promise<unknown>;
  refetchPersons: () => void;
  refetchRels: () => void;
}) {
  const { treeId, personId, person, addRel, refetchPersons, refetchRels } = opts;
  const router = useRouter();
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [isAddingRel, setIsAddingRel] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'parent' | 'child' | 'spouse' | null>(null);
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const setActiveTab = useCallback(
    (tab: PersonTab) => {
      const next = new URLSearchParams();
      if (treeId) next.set('tree', treeId);
      if (tab !== 'overview') next.set('tab', tab);
      router.replace(`/person/${personId}?${next.toString()}`, { scroll: false });
    },
    [treeId, personId, router]
  );

  const handleAddRelationship = async (
    type: RelationshipType,
    person1Id: string,
    person2Id: string
  ) => {
    setIsAddingRel(true);
    try {
      await addRel(type, person1Id, person2Id);
    } finally {
      setIsAddingRel(false);
    }
  };

  const handleQuickAdd = async (data: PersonSchemaFormData) => {
    if (!treeId || !person || !quickAddType) return;
    setIsQuickAdding(true);
    try {
      const newPersonId = await createPerson(treeId, data);
      if (quickAddType === 'spouse') {
        await addRelationshipFn(treeId, 'spouse', person.id, newPersonId);
      } else if (quickAddType === 'child') {
        await addRelationshipFn(treeId, 'parent-child', person.id, newPersonId);
      } else {
        await addRelationshipFn(treeId, 'parent-child', newPersonId, person.id);
      }
      refetchPersons();
      refetchRels();
      setQuickAddType(null);
    } finally {
      setIsQuickAdding(false);
    }
  };

  return {
    relModalOpen, setRelModalOpen, isAddingRel, quickAddType, setQuickAddType,
    isQuickAdding, setActiveTab, handleAddRelationship, handleQuickAdd,
  };
}
