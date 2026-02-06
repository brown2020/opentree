'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { usePersons } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { useMembers } from '@/lib/hooks/useMembers';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTreeStore } from '@/lib/stores/treeStore';
import { createPerson, updateTree } from '@/lib/firebase/firestore';
import { addRelationship } from '@/lib/firebase/relationships';
import { parseGedcom } from '@/lib/utils/gedcom';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { PersonCard } from '@/components/person/PersonCard';
import { AddPersonModal } from '@/components/person/AddPersonModal';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { TreeSearch } from '@/components/tree/TreeSearch';
import { AddRelationshipModal } from '@/components/tree/AddRelationshipModal';
import { TreeSettingsModal } from '@/components/tree/TreeSettingsModal';
import { RelationshipCalculatorModal } from '@/components/tree/RelationshipCalculatorModal';
import type { Person, RelationshipType } from '@/lib/types';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

type ViewMode = 'tree' | 'list';

export default function TreePage() {
  const params = useParams();
  const treeId = params.treeId as string;
  const { user } = useAuth();

  const { tree, loading: treeLoading, refetch: refetchTree } = useTreeDetails(treeId);
  const { loading: personsLoading, create, remove } = usePersons(treeId);
  const {
    relationships,
    loading: relsLoading,
    add: addRel,
    refetch: refetchRels,
  } = useRelationships(treeId);
  const {
    members,
    add: addMember,
    remove: removeMember,
    updateRole: updateMemberRole,
  } = useMembers(treeId);
  const { persons, selectedPersonId, setSelectedPersonId } = useTreeStore();

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletePerson, setDeletePerson] = useState<Person | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [relPerson, setRelPerson] = useState<Person | null>(null);
  const [isAddingRel, setIsAddingRel] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [rootPersonId, setRootPersonId] = useState<string | null>(null);

  const isOwner = tree?.userId === user?.uid;
  const effectiveRoot = rootPersonId || tree?.rootPersonId || null;

  const handleAddPerson = async (data: PersonSchemaFormData) => {
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

  const handleAddRelationship = async (
    type: RelationshipType,
    person1Id: string,
    person2Id: string
  ) => {
    setIsAddingRel(true);
    await addRel(type, person1Id, person2Id);
    setIsAddingRel(false);
  };

  const handleOpenRelModal = (person: Person) => {
    setRelPerson(person);
    setRelModalOpen(true);
  };

  const handleChangeRoot = useCallback(
    async (personId: string) => {
      setRootPersonId(personId);
      // Persist root to the tree document
      if (treeId) {
        await updateTree(treeId, { rootPersonId: personId });
        refetchTree();
      }
    },
    [treeId, refetchTree]
  );

  const handleSearchSelect = (personId: string) => {
    setSelectedPersonId(personId);
    setRootPersonId(personId);
  };

  const handleImportGedcom = async (file: File) => {
    const text = await file.text();
    const { persons: parsedPersons, families } = parseGedcom(text);

    // Create persons and track GEDCOM ID → Firestore ID mapping
    const gedcomToFirestoreId = new Map<string, string>();

    for (const pp of parsedPersons) {
      const id = await createPerson(treeId, {
        firstName: pp.firstName,
        lastName: pp.lastName,
        gender: pp.gender,
        birthDate: pp.birthDate,
        birthPlace: pp.birthPlace || undefined,
        deathDate: pp.deathDate,
        deathPlace: pp.deathPlace || undefined,
        isLiving: pp.isLiving,
        bio: pp.bio || undefined,
      });
      gedcomToFirestoreId.set(pp.gedcomId, id);
    }

    // Create relationships from families
    for (const fam of families) {
      const husbId = fam.husbandId
        ? gedcomToFirestoreId.get(fam.husbandId)
        : null;
      const wifeId = fam.wifeId
        ? gedcomToFirestoreId.get(fam.wifeId)
        : null;

      // Spouse relationship
      if (husbId && wifeId) {
        await addRelationship(
          treeId,
          'spouse',
          husbId,
          wifeId,
          fam.marriageDate,
          fam.divorceDate
        );
      }

      // Parent-child relationships
      for (const childGedcomId of fam.childIds) {
        const childId = gedcomToFirestoreId.get(childGedcomId);
        if (!childId) continue;

        if (husbId) {
          await addRelationship(treeId, 'parent-child', husbId, childId);
        }
        if (wifeId) {
          await addRelationship(treeId, 'parent-child', wifeId, childId);
        }
      }
    }

    // Refetch all data
    // The usePersons hook will refetch on its own since we called createPerson,
    // but relationships need a manual refetch
    refetchRels();
  };

  const handleUpdateTree = async (data: { isPublic?: boolean }) => {
    if (treeId) {
      await updateTree(treeId, data);
      refetchTree();
    }
  };

  if (treeLoading || personsLoading || relsLoading) {
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
              persons={persons}
              onSelectPerson={handleSearchSelect}
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

      {/* Main content */}
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
            persons={persons}
            relationships={relationships}
            selectedPersonId={selectedPersonId}
            onSelectPerson={setSelectedPersonId}
            treeId={treeId}
            rootPersonId={effectiveRoot}
            onChangeRoot={handleChangeRoot}
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
                  onAddRelationship={() => handleOpenRelModal(person)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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
        onUpdateTree={handleUpdateTree}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onUpdateMemberRole={updateMemberRole}
        onImportGedcom={handleImportGedcom}
        isOwner={isOwner}
      />

      <RelationshipCalculatorModal
        isOpen={calcOpen}
        onClose={() => setCalcOpen(false)}
        persons={persons}
        relationships={relationships}
      />
    </div>
  );
}
