'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { usePersonDetails, usePersons } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { useTreeStore } from '@/lib/stores/treeStore';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { useMembers } from '@/lib/hooks/useMembers';
import { useTreePrivacy } from '@/lib/hooks/useTreePrivacy';
import { usePersonRelations } from '@/lib/hooks/usePersonRelations';
import { usePersonDetailActions } from '@/lib/hooks/usePersonDetailActions';
import { buildPersonDetailCtx } from '@/lib/hooks/buildPersonDetailCtx';

type PersonTab = 'overview' | 'photos' | 'documents' | 'timeline';

export function usePersonDetailModel() {
  const params = useParams()!;
  const searchParams = useSearchParams()!;
  const personId = params.personId as string;
  const treeId = searchParams.get('tree');
  const tabParam = searchParams.get('tab') as PersonTab | null;
  const activeTab: PersonTab = ['overview', 'photos', 'documents', 'timeline'].includes(tabParam as string)
    ? (tabParam as PersonTab)
    : 'overview';

  const { person, loading } = usePersonDetails(treeId, personId);
  const { loading: personsLoading, refetch: refetchPersons } = usePersons(treeId);
  const { persons } = useTreeStore();
  const { relationships, add: addRel, refetch: refetchRels } = useRelationships(treeId);
  const { tree } = useTreeDetails(treeId);
  const { members } = useMembers(treeId);
  const { canViewFullPerson, getDisplayPerson } = useTreePrivacy(tree, members);
  const { related, marriageDates } = usePersonRelations(person, persons, relationships);
  const actions = usePersonDetailActions({
    treeId, personId, person, addRel, refetchPersons, refetchRels,
  });

  const showFullDetailsForEffect = !person || canViewFullPerson(person);

  useEffect(() => {
    if (person && !showFullDetailsForEffect && activeTab !== 'overview') {
      actions.setActiveTab('overview');
    }
  }, [person, showFullDetailsForEffect, activeTab, actions]);

  if (loading || personsLoading) return { status: 'loading' as const };
  if (!person || !treeId) return { status: 'notfound' as const };

  const ctx = buildPersonDetailCtx({
    treeId,
    tree,
    person,
    personId,
    showFullDetails: canViewFullPerson(person),
    displayPerson: getDisplayPerson(person),
    related,
    marriageDates,
    canViewFullPerson,
    getDisplayPerson,
    activeTab,
    persons,
    relationships,
    ...actions,
  });

  return { status: 'ready' as const, ctx };
}
