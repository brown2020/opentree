'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { AddRelationshipModal } from '@/components/tree/AddRelationshipModal';
import { AddPersonModal } from '@/components/person/AddPersonModal';

export function PersonDetailModals({ ctx }: { ctx: UiCtx }) {
  const {
    treeId, person, persons, relationships, relModalOpen, setRelModalOpen,
    quickAddType, setQuickAddType, isQuickAdding, handleQuickAdd,
    handleAddRelationship, isAddingRel,
  } = ctx;
  return (
    <>
      {/* Relationship Modal */}
      {person && (
        <AddRelationshipModal
          isOpen={relModalOpen}
          onClose={() => setRelModalOpen(false)}
          person={person}
          allPersons={persons}
          existingRelationships={relationships}
          onAdd={handleAddRelationship}
          loading={isAddingRel}
        />
      )}

      {/* Quick-add person modal */}
      <AddPersonModal
        isOpen={!!quickAddType}
        onClose={() => setQuickAddType(null)}
        onSubmit={handleQuickAdd}
        loading={isQuickAdding}
        treeId={treeId!}
        existingPersons={persons}
      />
    </>
  );
}
