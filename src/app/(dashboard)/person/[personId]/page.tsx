'use client';

import { Suspense, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { usePersonDetails } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { usePersons } from '@/lib/hooks/usePerson';
import { useTreeStore } from '@/lib/stores/treeStore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AddRelationshipModal } from '@/components/tree/AddRelationshipModal';
import { timestampToDate } from '@/lib/firebase/firestore';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';
import type { Person, RelationshipType } from '@/lib/types';

function PersonDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const personId = params.personId as string;
  const treeId = searchParams.get('tree');

  const { person, loading } = usePersonDetails(treeId, personId);
  const { loading: personsLoading } = usePersons(treeId);
  const { persons } = useTreeStore();
  const { relationships, add: addRel } = useRelationships(treeId);
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [isAddingRel, setIsAddingRel] = useState(false);

  // Build adjacency for this person
  const related = useMemo(() => {
    if (!person || persons.length === 0) {
      return { parents: [] as Person[], children: [] as Person[], spouses: [] as Person[], siblings: [] as Person[] };
    }

    const personIds = persons.map((p) => p.id);
    const adj = buildAdjacencyMap(personIds, relationships);
    const entry = adj.get(person.id);

    if (!entry) {
      return { parents: [] as Person[], children: [] as Person[], spouses: [] as Person[], siblings: [] as Person[] };
    }

    const personMap = new Map(persons.map((p) => [p.id, p]));

    const parentsList = entry.parents
      .map((id) => personMap.get(id))
      .filter((p): p is Person => !!p);

    const childrenList = entry.children
      .map((id) => personMap.get(id))
      .filter((p): p is Person => !!p);

    const spousesList = entry.spouses
      .map((id) => personMap.get(id))
      .filter((p): p is Person => !!p);

    // Siblings: people who share at least one parent
    const siblingIds = new Set<string>();
    for (const parentId of entry.parents) {
      const parentEntry = adj.get(parentId);
      if (parentEntry) {
        for (const childId of parentEntry.children) {
          if (childId !== person.id) siblingIds.add(childId);
        }
      }
    }
    const siblingsList = [...siblingIds]
      .map((id) => personMap.get(id))
      .filter((p): p is Person => !!p);

    return {
      parents: parentsList,
      children: childrenList,
      spouses: spousesList,
      siblings: siblingsList,
    };
  }, [person, persons, relationships]);

  const handleAddRelationship = async (
    type: RelationshipType,
    person1Id: string,
    person2Id: string
  ) => {
    setIsAddingRel(true);
    await addRel(type, person1Id, person2Id);
    setIsAddingRel(false);
  };

  if (loading || personsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!person || !treeId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Person not found</p>
      </div>
    );
  }

  const birthDate = timestampToDate(person.birthDate);
  const deathDate = timestampToDate(person.deathDate);

  const genderColor = {
    male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const initials =
    `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase() ||
    '?';

  const hasRelationships =
    related.parents.length > 0 ||
    related.children.length > 0 ||
    related.spouses.length > 0 ||
    related.siblings.length > 0;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href={`/tree/${treeId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to tree
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {person.profilePhotoUrl ? (
          <Image
            src={person.profilePhotoUrl}
            alt={`${person.firstName} ${person.lastName}`}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg dark:ring-gray-800"
          />
        ) : (
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-white shadow-lg dark:ring-gray-800 ${genderColor[person.gender]}`}
          >
            {initials}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {person.firstName} {person.middleName} {person.lastName}
            {person.maidenName && (
              <span className="text-gray-500"> (nee {person.maidenName})</span>
            )}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400">
            {birthDate && (
              <span>Born {format(birthDate, 'MMMM d, yyyy')}</span>
            )}
            {!person.isLiving && deathDate && (
              <span>Died {format(deathDate, 'MMMM d, yyyy')}</span>
            )}
            {!person.isLiving && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                Deceased
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRelModalOpen(true)}
          >
            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Add Relationship
          </Button>
          <Link href={`/person/${personId}/edit?tree=${treeId}`}>
            <Button variant="outline" size="sm">
              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Biography */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Biography
            </h2>
            {person.bio ? (
              <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                {person.bio}
              </p>
            ) : (
              <p className="italic text-gray-400 dark:text-gray-500">
                No biography added yet.
              </p>
            )}
          </div>

          {/* Relationships */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Family
              </h2>
              <button
                onClick={() => setRelModalOpen(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                + Add
              </button>
            </div>

            {!hasRelationships ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No relationships added yet.
                </p>
                <button
                  onClick={() => setRelModalOpen(true)}
                  className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  Add a relationship
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {related.spouses.length > 0 && (
                  <RelationSection
                    title="Spouse(s)"
                    persons={related.spouses}
                    treeId={treeId}
                  />
                )}
                {related.parents.length > 0 && (
                  <RelationSection
                    title="Parents"
                    persons={related.parents}
                    treeId={treeId}
                  />
                )}
                {related.siblings.length > 0 && (
                  <RelationSection
                    title="Siblings"
                    persons={related.siblings}
                    treeId={treeId}
                  />
                )}
                {related.children.length > 0 && (
                  <RelationSection
                    title="Children"
                    persons={related.children}
                    treeId={treeId}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick links sidebar */}
        <div className="space-y-4">
          <Link
            href={`/person/${personId}/photos?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Photos</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">View and manage photos</p>
            </div>
          </Link>

          <Link
            href={`/person/${personId}/documents?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Documents</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Birth certificates, records</p>
            </div>
          </Link>

          <Link
            href={`/person/${personId}/timeline?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Timeline</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Life events and milestones</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Relationship Modal */}
      {person && (
        <AddRelationshipModal
          isOpen={relModalOpen}
          onClose={() => setRelModalOpen(false)}
          person={person}
          allPersons={persons}
          onAdd={handleAddRelationship}
          loading={isAddingRel}
        />
      )}
    </div>
  );
}

function RelationSection({
  title,
  persons,
  treeId,
}: {
  title: string;
  persons: Person[];
  treeId: string;
}) {
  const genderColors: Record<string, string> = {
    male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => (
          <Link
            key={p.id}
            href={`/person/${p.id}?tree=${treeId}`}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
          >
            {p.profilePhotoUrl ? (
              <Image
                src={p.profilePhotoUrl}
                alt={`${p.firstName} ${p.lastName}`}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${genderColors[p.gender] || genderColors.unknown}`}
              >
                {p.firstName?.[0]}
              </span>
            )}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {p.firstName} {p.lastName}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function PersonDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PersonDetailContent />
    </Suspense>
  );
}
