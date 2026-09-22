'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { ConfirmModal } from '@/components/ui/Modal';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { AddRelationshipModal } from '@/components/tree/AddRelationshipModal';
import { TreeSettingsModal } from '@/components/tree/TreeSettingsModal';
import { RelationshipCalculatorModal } from '@/components/tree/RelationshipCalculatorModal';

export function TreePageModals({ ctx }: { ctx: UiCtx }) {
  const {
    activityOpen,
    addMember,
    addModalOpen,
    addRel,
    calcOpen,
    create,
    deletePerson,
    displayPersons,
    effectiveRoot,
    getDisplayPersons,
    getLifespanLabel,
    handleAddPerson,
    handleAddRelationship,
    handleChangeRoot,
    handleCommitGedcomImport,
    handleDeletePerson,
    handleExportChart,
    handleOpenRelModal,
    handleSearchSelect,
    handleUpdateTree,
    importError,
    invites,
    isAdding,
    isAddingRel,
    isDeleting,
    isOwner,
    members,
    params,
    persons,
    personsLoading,
    refetchPersons,
    refetchRels,
    refetchTree,
    relModalOpen,
    relPerson,
    relationships,
    relsLoading,
    remove,
    removeMember,
    revokeInvite,
    rootPersonId,
    selectedPersonId,
    setActivityOpen,
    setAddModalOpen,
    setCalcOpen,
    setDeletePerson,
    setImportError,
    setIsAdding,
    setIsAddingRel,
    setIsDeleting,
    setRelModalOpen,
    setRelPerson,
    setRootPersonId,
    setSelectedPersonId,
    setSettingsOpen,
    setViewMode,
    settingsOpen,
    tree,
    treeError,
    treeId,
    treeLoading,
    updateMemberRole,
    user,
    viewMode
  } = ctx;
  return (
    <>
      {/* Modals */}
      <AddPersonModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddPerson}
        loading={isAdding}
        treeId={treeId}
        existingPersons={persons}
      />

      <ConfirmModal
        isOpen={!!deletePerson}
        onClose={() => setDeletePerson(null)}
        onConfirm={handleDeletePerson}
        title="Delete Person"
        message={`Are you sure you want to delete ${deletePerson?.firstName} ${deletePerson?.lastName}? This will also remove all their photos, documents, relationships, and timeline events.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />

      {relPerson && (
        <AddRelationshipModal
          isOpen={relModalOpen}
          onClose={() => {
            setRelModalOpen(false);
            setRelPerson(null);
          }}
          person={relPerson}
          allPersons={persons}
          existingRelationships={relationships}
          onAdd={handleAddRelationship}
          loading={isAddingRel}
        />
      )}

      <TreeSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tree={tree}
        persons={persons}
        relationships={relationships}
        members={members}
        invites={invites}
        onUpdateTree={handleUpdateTree}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onRevokeInvite={revokeInvite}
        onUpdateMemberRole={updateMemberRole}
        onCommitGedcomImport={handleCommitGedcomImport}
        isOwner={isOwner}
      />

      <RelationshipCalculatorModal
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
        persons={displayPersons}
        relationships={relationships}
      />
    </>
  );
}
