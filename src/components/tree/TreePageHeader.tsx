'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { TreeSearch } from '@/components/tree/TreeSearch';

export function TreePageHeader({ ctx }: { ctx: UiCtx }) {
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
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tree.name}
          </h1>
          {tree.description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tree.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="w-48 lg:w-64">
            <TreeSearch
              persons={displayPersons}
              onSelectPerson={handleSearchSelect}
              getLifespanLabel={getLifespanLabel}
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              onClick={() => setViewMode('tree')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              List
            </button>
          </div>

          {viewMode === 'tree' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChart}
              disabled={displayPersons.length === 0}
              aria-label="Export pedigree chart as SVG"
            >
              <svg
                className="-ml-1 mr-1.5 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12V8a4 4 0 014-4h8a4 4 0 014 4v4"
                />
              </svg>
              Export chart
            </Button>
          )}

          {/* Action buttons */}
          <Button onClick={() => setAddModalOpen(true)} size="sm">
            <svg
              className="-ml-1 mr-1.5 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Person
          </Button>

          {/* More menu */}
          <div className="flex gap-1">
            <button
              onClick={() => setActivityOpen(!activityOpen)}
              className={`rounded-lg p-2 transition-colors ${
                activityOpen
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
              }`}
              title="Activity Feed"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => setCalcOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              title="Relationship Calculator"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              title="Tree Settings"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {importError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <span>GEDCOM import error: {importError}</span>
          <button type="button" aria-label="Dismiss import error" onClick={() => setImportError(null)} className="ml-4 text-red-500 hover:text-red-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

    </>
  );
}
