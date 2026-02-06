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
import { PhotoGallery } from '@/components/person/PhotoGallery';
import { DocumentList } from '@/components/person/DocumentList';
import { TimelineView } from '@/components/person/TimelineView';
import { timestampToDate } from '@/lib/firebase/firestore';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';
import type { Person, RelationshipType } from '@/lib/types';

type PersonTab = 'overview' | 'photos' | 'documents' | 'timeline';

function PersonDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const personId = params.personId as string;
  const treeId = searchParams.get('tree');

  const { person, loading } = usePersonDetails(treeId, personId);
  const { loading: personsLoading } = usePersons(treeId);
  const { persons } = useTreeStore();
  const { relationships, add: addRel } = useRelationships(treeId);
  const [activeTab, setActiveTab] = useState<PersonTab>('overview');
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [isAddingRel, setIsAddingRel] = useState(false);

  // Build adjacency for this person — includes step-relationships
  const related = useMemo(() => {
    const empty = {
      parents: [] as Person[],
      children: [] as Person[],
      spouses: [] as Person[],
      siblings: [] as Person[],
      stepParents: [] as Person[],
      stepChildren: [] as Person[],
      stepSiblings: [] as Person[],
    };

    if (!person || persons.length === 0) return empty;

    const personIds = persons.map((p) => p.id);
    const adj = buildAdjacencyMap(personIds, relationships);
    const entry = adj.get(person.id);
    if (!entry) return empty;

    const personMap = new Map(persons.map((p) => [p.id, p]));
    const resolve = (ids: string[]) =>
      ids.map((id) => personMap.get(id)).filter((p): p is Person => !!p);

    const parentsList = resolve(entry.parents);
    const childrenList = resolve(entry.children);
    const spousesList = resolve(entry.spouses);

    // Biological siblings: share at least one parent
    const siblingIds = new Set<string>();
    for (const parentId of entry.parents) {
      const parentEntry = adj.get(parentId);
      if (parentEntry) {
        for (const childId of parentEntry.children) {
          if (childId !== person.id) siblingIds.add(childId);
        }
      }
    }

    // Step-parents: spouses of biological parents who are NOT this person's parent
    const stepParentIds = new Set<string>();
    for (const parentId of entry.parents) {
      const parentEntry = adj.get(parentId);
      if (parentEntry) {
        for (const spouseId of parentEntry.spouses) {
          if (!entry.parents.includes(spouseId)) {
            stepParentIds.add(spouseId);
          }
        }
      }
    }

    // Step-children: children of spouse who are NOT this person's children
    const stepChildIds = new Set<string>();
    for (const spouseId of entry.spouses) {
      const spouseEntry = adj.get(spouseId);
      if (spouseEntry) {
        for (const childId of spouseEntry.children) {
          if (!entry.children.includes(childId)) {
            stepChildIds.add(childId);
          }
        }
      }
    }

    // Step-siblings: children of step-parents who are not biological siblings or self
    const stepSiblingIds = new Set<string>();
    for (const stepParentId of stepParentIds) {
      const stepParentEntry = adj.get(stepParentId);
      if (stepParentEntry) {
        for (const childId of stepParentEntry.children) {
          if (childId !== person.id && !siblingIds.has(childId)) {
            stepSiblingIds.add(childId);
          }
        }
      }
    }

    return {
      parents: parentsList,
      children: childrenList,
      spouses: spousesList,
      siblings: resolve([...siblingIds]),
      stepParents: resolve([...stepParentIds]),
      stepChildren: resolve([...stepChildIds]),
      stepSiblings: resolve([...stepSiblingIds]),
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
    related.siblings.length > 0 ||
    related.stepParents.length > 0 ||
    related.stepChildren.length > 0 ||
    related.stepSiblings.length > 0;

  const tabs: { key: PersonTab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'photos', label: 'Photos', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { key: 'documents', label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'timeline', label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div className="mx-auto max-w-5xl">
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
      <div className="mb-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
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
          <Button variant="outline" size="sm" onClick={() => setRelModalOpen(true)}>
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

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Person sections">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Biography */}
          <div className="lg:col-span-2">
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
          </div>

          {/* Key Facts sidebar */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Facts
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Gender</dt>
                  <dd className="font-medium capitalize text-gray-900 dark:text-gray-100">
                    {person.gender}
                  </dd>
                </div>
                {birthDate && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Birth</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {format(birthDate, 'MMMM d, yyyy')}
                      {person.birthPlace && (
                        <span className="block text-xs text-gray-500">{person.birthPlace}</span>
                      )}
                    </dd>
                  </div>
                )}
                {!person.isLiving && deathDate && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Death</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {format(deathDate, 'MMMM d, yyyy')}
                      {person.deathPlace && (
                        <span className="block text-xs text-gray-500">{person.deathPlace}</span>
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {person.isLiving ? 'Living' : 'Deceased'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Relationships — full width */}
          <div className="lg:col-span-3">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.spouses.length > 0 && (
                    <RelationSection title="Spouse(s)" persons={related.spouses} treeId={treeId} />
                  )}
                  {related.parents.length > 0 && (
                    <RelationSection title="Parents" persons={related.parents} treeId={treeId} />
                  )}
                  {related.stepParents.length > 0 && (
                    <RelationSection title="Step-Parents" persons={related.stepParents} treeId={treeId} />
                  )}
                  {related.siblings.length > 0 && (
                    <RelationSection title="Siblings" persons={related.siblings} treeId={treeId} />
                  )}
                  {related.stepSiblings.length > 0 && (
                    <RelationSection title="Step-Siblings" persons={related.stepSiblings} treeId={treeId} />
                  )}
                  {related.children.length > 0 && (
                    <RelationSection title="Children" persons={related.children} treeId={treeId} />
                  )}
                  {related.stepChildren.length > 0 && (
                    <RelationSection title="Step-Children" persons={related.stepChildren} treeId={treeId} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <PhotoGallery treeId={treeId} personId={personId} />
      )}

      {activeTab === 'documents' && (
        <DocumentList treeId={treeId} personId={personId} />
      )}

      {activeTab === 'timeline' && (
        <TimelineView treeId={treeId} personId={personId} />
      )}

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
