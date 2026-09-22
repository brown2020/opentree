'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { usePersons } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { useTreeStore } from '@/lib/stores/treeStore';
import { useTreePrivacy } from '@/lib/hooks/useTreePrivacy';
import { PublicTreeContent } from '@/components/tree/PublicTreeContent';
import {
  PublicTreeLoading,
  PublicTreeNotFound,
  PublicTreePrivate,
} from '@/components/tree/PublicTreeStatus';

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

  const { getDisplayPersons, getLifespanLabel } = useTreePrivacy(tree, []);
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

  if (treeLoading || personsLoading || relsLoading) return <PublicTreeLoading />;
  if (!tree || treeError) return <PublicTreeNotFound />;
  if (!tree.isPublic) return <PublicTreePrivate />;

  return (
    <PublicTreeContent
      tree={tree}
      treeId={treeId}
      displayPersons={displayPersons}
      relationships={relationships}
      selectedPersonId={selectedPersonId}
      selectedPerson={selectedPerson}
      viewMode={viewMode}
      effectiveRoot={effectiveRoot}
      setViewMode={setViewMode}
      setSelectedPersonId={setSelectedPersonId}
      setRootPersonId={setRootPersonId}
      handleSearchSelect={handleSearchSelect}
      getLifespanLabel={getLifespanLabel}
    />
  );
}
