'use client';

import type { Person } from '@/lib/types';

import type { UiCtx } from '@/lib/types/uiCtx';

import { FamilyTree } from '@/components/tree/FamilyTree';
import { PersonCard } from '@/components/person/PersonCard';
import { Button } from '@/components/ui/Button';
import { ActivityFeed } from '@/components/tree/ActivityFeed';

export function TreePageMain({ ctx }: { ctx: UiCtx }) {
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
      {/* Main content + activity sidebar */}
      <div className="flex flex-1 gap-4 overflow-hidden">
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {persons.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              No people in this tree
            </h3>
            <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Start by adding the first person to your family tree, or import
              a GEDCOM file.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setAddModalOpen(true)}>
                Add First Person
              </Button>
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(true)}
              >
                Import GEDCOM
              </Button>
            </div>
          </div>
        ) : viewMode === 'tree' ? (
          <FamilyTree
            persons={displayPersons}
            relationships={relationships}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            treeId={treeId}
            rootPersonId={effectiveRoot}
            onChangeRoot={handleChangeRoot}
            getLifespanLabel={getLifespanLabel}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayPersons.map((person: Person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  treeId={treeId}
                  isSelected={selectedPersonId === person.id}
                  onClick={() => setSelectedPersonId(person.id)}
                  onAddRelationship={() => handleOpenRelModal(persons.find((p: Person) => p.id === person.id) ?? person)}
                  lifespan={getLifespanLabel(person)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Activity panel */}
      {activityOpen && (
        <div className="hidden w-72 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 lg:block dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Recent Activity
            </h3>
            <button
              type="button"
              aria-label="Close activity feed"
              onClick={() => setActivityOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ActivityFeed treeId={treeId} />
        </div>
      )}
      </div>

    </>
  );
}
