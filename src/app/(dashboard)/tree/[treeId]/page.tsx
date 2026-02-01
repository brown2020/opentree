'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { usePersons } from '@/lib/hooks/usePerson';
import { useTreeStore } from '@/lib/stores/treeStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { PersonCard } from '@/components/person/PersonCard';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { FamilyTree } from '@/components/tree/FamilyTree';
import type { Person, PersonFormData } from '@/lib/types';

type ViewMode = 'tree' | 'list';

export default function TreePage() {
  const params = useParams();
  const treeId = params.treeId as string;

  const { tree, loading: treeLoading } = useTreeDetails(treeId);
  const { loading: personsLoading, create, remove } = usePersons(treeId);
  const { persons, selectedPersonId, setSelectedPersonId } = useTreeStore();

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddPerson = async (data: PersonFormData) => {
    setIsAdding(true);
    await create(data);
    setIsAdding(false);
    setAddModalOpen(false);
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;

    setIsDeleting(true);
    await remove(deletePerson.id);
    setIsDeleting(false);
    setDeletePerson(null);
  };

  if (treeLoading || personsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Tree not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
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
          <div className="flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              onClick={() => setViewMode('tree')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              List View
            </button>
          </div>

          <Button onClick={() => setAddModalOpen(true)}>
            <svg
              className="-ml-1 mr-2 h-5 w-5"
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
        </div>
      </div>

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
              Start by adding the first person to your family tree.
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              Add First Person
            </Button>
          </div>
        ) : viewMode === 'tree' ? (
          <FamilyTree
            persons={persons}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            treeId={treeId}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {persons.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  treeId={treeId}
                  isSelected={selectedPersonId === person.id}
                  onClick={() => setSelectedPersonId(person.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AddPersonModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddPerson}
        loading={isAdding}
      />

      <ConfirmModal
        isOpen={!!deletePerson}
        onClose={() => setDeletePerson(null)}
        onConfirm={handleDeletePerson}
        title="Delete Person"
        message={`Are you sure you want to delete ${deletePerson?.firstName} ${deletePerson?.lastName}? This will also remove all their photos, documents, and timeline events.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
