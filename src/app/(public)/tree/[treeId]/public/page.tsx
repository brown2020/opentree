'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { usePersons } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { useTreeStore } from '@/lib/stores/treeStore';
import { useTreePrivacy } from '@/lib/hooks/useTreePrivacy';
import { FamilyTree } from '@/components/tree/FamilyTree';
import { TreeSearch } from '@/components/tree/TreeSearch';
import { PersonCard } from '@/components/person/PersonCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

type ViewMode = 'tree' | 'list';

export default function PublicTreePage() {
  const params = useParams();
  const treeId = params.treeId as string;

  const { tree, loading: treeLoading, error: treeError } = useTreeDetails(treeId);
  const { loading: personsLoading } = usePersons(treeId);
  const { relationships, loading: relsLoading } = useRelationships(treeId);
  const { persons, selectedPersonId, setSelectedPersonId } = useTreeStore();

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [rootPersonId, setRootPersonId] = useState<string | null>(null);

  const { getDisplayPersons, getLifespanLabel } = useTreePrivacy(
    tree,
    []
  );
  const displayPersons = useMemo(
    () => getDisplayPersons(persons),
    [persons, getDisplayPersons]
  );

  const effectiveRoot = rootPersonId || tree?.rootPersonId || null;
  const selectedPerson = selectedPersonId
    ? displayPersons.find((p) => p.id === selectedPersonId) ?? null
    : null;

  const handleSearchSelect = (personId: string) => {
    setSelectedPersonId(personId);
    setRootPersonId(personId);
  };

  if (treeLoading || personsLoading || relsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tree || treeError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Tree not found
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This tree may be private or the link is incorrect.
        </p>
        <Link href="/signup" className="mt-6">
          <Button>Create your own tree</Button>
        </Link>
      </div>
    );
  }

  if (!tree.isPublic) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          This tree is private
        </h1>
        <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          The owner has not made this tree publicly viewable. Log in if you have
          been invited as a member.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/login">
            <Button variant="outline">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign up free</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      <div
        role="region"
        aria-label="Create your own family tree"
        className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            You are viewing a public family tree. Sign up to build and edit your
            own tree for free.
          </p>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Public tree
          </p>
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
          <div className="w-48 lg:w-64">
            <TreeSearch
              persons={displayPersons}
              onSelectPerson={handleSearchSelect}
              getLifespanLabel={getLifespanLabel}
            />
          </div>

          <div className="flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
            <button
              type="button"
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
              type="button"
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
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {displayPersons.length === 0 ? (
            <div className="flex h-full items-center justify-center p-12 text-sm text-gray-500 dark:text-gray-400">
              This tree has no people yet.
            </div>
          ) : viewMode === 'tree' ? (
            <FamilyTree
              persons={displayPersons}
              relationships={relationships}
              selectedPersonId={selectedPersonId}
              onSelectPerson={setSelectedPersonId}
              treeId={treeId}
              rootPersonId={effectiveRoot}
              onChangeRoot={setRootPersonId}
              getLifespanLabel={getLifespanLabel}
              readOnly
            />
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displayPersons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    treeId={treeId}
                    isSelected={selectedPersonId === person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                    lifespan={getLifespanLabel(person)}
                    readOnly
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedPerson && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 lg:block dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedPerson.firstName} {selectedPerson.lastName}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {getLifespanLabel(selectedPerson)}
            </p>
            {selectedPerson.birthPlace && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Born: {selectedPerson.birthPlace}
              </p>
            )}
            {selectedPerson.bio ? (
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                {selectedPerson.bio}
              </p>
            ) : selectedPerson.isLiving ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Details for living persons are limited on public trees.
              </p>
            ) : null}
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Want to add your own family history?
              </p>
              <Link href="/signup" className="mt-2 inline-block">
                <Button size="sm" className="w-full">
                  Create a free account
                </Button>
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
