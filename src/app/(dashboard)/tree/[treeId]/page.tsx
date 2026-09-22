'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTreeDetails } from '@/lib/hooks/useTree';
import { usePersons } from '@/lib/hooks/usePerson';
import { useRelationships } from '@/lib/hooks/useRelationships';
import { useMembers } from '@/lib/hooks/useMembers';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTreeStore } from '@/lib/stores/treeStore';
import { updateTree } from '@/lib/firebase/firestore';
import type { ParsedFamily, ParsedPerson } from '@/lib/utils/gedcom';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { commitGedcomImport } from '@/lib/tree/commitGedcomImport';
import { TreePageHeader } from '@/components/tree/TreePageHeader';
import { TreePageMain } from '@/components/tree/TreePageMain';
import { TreePageModals } from '@/components/tree/TreePageModals';
import { useTreePrivacy } from '@/lib/hooks/useTreePrivacy';
import { downloadPedigreeChart } from '@/lib/utils/pedigreeChartExport';
import type { Person, RelationshipType } from '@/lib/types';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

type ViewMode = 'tree' | 'list';

export default function TreePage() {
  const params = useParams()!;
  const treeId = params.treeId as string;
  const { user } = useAuth();

  const { tree, loading: treeLoading, error: treeError, refetch: refetchTree } = useTreeDetails(treeId);
  const { loading: personsLoading, create, remove, refetch: refetchPersons } = usePersons(treeId);
  const {
    relationships,
    loading: relsLoading,
    add: addRel,
    refetch: refetchRels,
  } = useRelationships(treeId);
  const {
    members,
    invites,
    add: addMember,
    remove: removeMember,
    revokeInvite,
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
  const [activityOpen, setActivityOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const isOwner = tree?.userId === user?.uid;
  const effectiveRoot = rootPersonId || tree?.rootPersonId || null;
  const { getDisplayPersons, getLifespanLabel } = useTreePrivacy(tree, members);
  const displayPersons = useMemo(
    () => getDisplayPersons(persons),
    [persons, getDisplayPersons]
  );

  const handleExportChart = useCallback(() => {
    const root = effectiveRoot || displayPersons[0]?.id;
    if (!root || !tree || displayPersons.length === 0) return;

    downloadPedigreeChart({
      persons: displayPersons,
      relationships,
      rootPersonId: root,
      treeName: tree.name,
      getLifespanLabel,
    });
  }, [effectiveRoot, displayPersons, tree, relationships, getLifespanLabel]);

  const handleAddPerson = async (data: PersonSchemaFormData) => {
    setIsAdding(true);
    try {
      await create(data);
      setAddModalOpen(false);
    } catch {
      // Error is surfaced by the usePerson hook's error state
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePerson) return;
    setIsDeleting(true);
    try {
      await remove(deletePerson.id);
      setDeletePerson(null);
    } catch {
      // Error is surfaced by the usePerson hook's error state
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddRelationship = async (
    type: RelationshipType,
    person1Id: string,
    person2Id: string
  ) => {
    setIsAddingRel(true);
    try {
      await addRel(type, person1Id, person2Id);
    } catch {
      // Error is surfaced by the useRelationships hook's error state
    } finally {
      setIsAddingRel(false);
    }
  };

  const handleOpenRelModal = (person: Person) => {
    setRelPerson(person);
    setRelModalOpen(true);
  };

  const handleChangeRoot = useCallback(
    async (personId: string) => {
      setRootPersonId(personId);
      if (treeId) {
        try {
          await updateTree(treeId, { rootPersonId: personId });
          refetchTree();
        } catch {
          // Revert local state on failure
          setRootPersonId(null);
        }
      }
    },
    [treeId, refetchTree]
  );

  const handleSearchSelect = (personId: string) => {
    setSelectedPersonId(personId);
    setRootPersonId(personId);
  };

  const handleCommitGedcomImport = async (data: {
    persons: ParsedPerson[];
    families: ParsedFamily[];
  }) => {
    setImportError(null);
    try {
      await commitGedcomImport({
        treeId,
        persons: data.persons,
        families: data.families,
        user,
        refetchPersons,
        refetchRels,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to import GEDCOM file';
      setImportError(msg);
      throw err;
    }
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
        <p className="text-gray-500 dark:text-gray-400">
          {treeError ? 'Unable to load this tree. You may not have access.' : 'Tree not found'}
        </p>
      </div>
    );
  }

  const treePageCtx = {
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
    viewMode,
  };

  return (
    <div className="flex h-full flex-col">
      <TreePageHeader ctx={treePageCtx} />
      <TreePageMain ctx={treePageCtx} />
      <TreePageModals ctx={treePageCtx} />
    </div>
  );
}
