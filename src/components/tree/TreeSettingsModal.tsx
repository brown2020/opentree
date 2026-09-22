'use client';

import { TreeSettingsGeneralTab } from '@/components/tree/settings/TreeSettingsGeneralTab';
import { TreeSettingsSharingTab } from '@/components/tree/settings/TreeSettingsSharingTab';
import { TreeSettingsGedcomTab } from '@/components/tree/settings/TreeSettingsGedcomTab';

import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Tree, TreeMember, TreeInvite, MemberRole, Person, Relationship } from '@/lib/types';
import type { AddTreeMemberResult } from '@/lib/firebase/members';
import { exportToGedcom, downloadGedcom } from '@/lib/utils/gedcom';
import type { ParsedFamily, ParsedPerson } from '@/lib/utils/gedcom';
import { parseGedcomForImport } from '@/lib/utils/gedcomImport';
import { findGedcomImportDuplicates, type GedcomDuplicateMatch } from '@/lib/utils/duplicatePerson';
import { exportTreeAsZip } from '@/lib/utils/exportZip';
import { useAuth } from '@/lib/hooks/useAuth';
import { GedcomImportPreviewModal } from '@/components/tree/GedcomImportPreviewModal';

type SettingsTab = 'general' | 'sharing' | 'gedcom';

interface TreeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tree: Tree;
  persons: Person[];
  relationships: Relationship[];
  members: TreeMember[];
  invites: TreeInvite[];
  onUpdateTree: (data: { isPublic?: boolean }) => Promise<void>;
  onAddMember: (email: string, role: MemberRole) => Promise<AddTreeMemberResult>;
  onRemoveMember: (userId: string) => Promise<boolean>;
  onRevokeInvite: (inviteId: string) => Promise<boolean>;
  onUpdateMemberRole: (userId: string, role: MemberRole) => Promise<boolean>;
  onCommitGedcomImport: (data: {
    persons: ParsedPerson[];
    families: ParsedFamily[];
  }) => Promise<void>;
  isOwner: boolean;
}

export function TreeSettingsModal({
  isOpen,
  onClose,
  tree,
  persons,
  relationships,
  members,
  invites,
  onUpdateTree,
  onAddMember,
  onRemoveMember,
  onRevokeInvite,
  onUpdateMemberRole,
  onCommitGedcomImport,
  isOwner,
}: TreeSettingsModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');
  const [inviteError, setInviteError] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importParseError, setImportParseError] = useState<string | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewFileName, setImportPreviewFileName] = useState('');
  const [importPreviewData, setImportPreviewData] = useState<{
    persons: ParsedPerson[];
    families: ParsedFamily[];
    summary: ReturnType<typeof parseGedcomForImport>['summary'];
  } | null>(null);
  const [importDuplicateMatches, setImportDuplicateMatches] = useState<
    GedcomDuplicateMatch[]
  >([]);
  const [importCommitError, setImportCommitError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [publicLinkCopied, setPublicLinkCopied] = useState(false);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setExportError(null);
    try {
      const content = exportToGedcom(tree.name, persons, relationships, {
        tree,
        userId: user?.uid,
        members,
      });
      const filename = tree.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      downloadGedcom(content, `${filename}.ged`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export GEDCOM');
    } finally {
      setIsExporting(false);
    }
  }, [tree, persons, relationships, members, user?.uid]);

  const handleExportZip = useCallback(async () => {
    setIsExportingZip(true);
    setExportError(null);
    try {
      await exportTreeAsZip(tree.id, tree.name, persons, relationships);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to export ZIP');
    } finally {
      setIsExportingZip(false);
    }
  }, [tree.id, tree.name, persons, relationships]);

  const handleImportFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
      if (!file) return;

      setImportParseError(null);
      setImportCommitError(null);

      try {
        const text = await file.text();
        const parsed = parseGedcomForImport(text);
        setImportPreviewFileName(file.name);
        setImportPreviewData(parsed);
        setImportDuplicateMatches(
          findGedcomImportDuplicates(parsed.persons, persons)
        );
        setImportPreviewOpen(true);
      } catch (err) {
        setImportParseError(
          err instanceof Error ? err.message : 'Failed to read GEDCOM file'
        );
      }
    },
    [persons]
  );

  const resetImportPreview = useCallback(() => {
    setImportPreviewOpen(false);
    setImportPreviewData(null);
    setImportPreviewFileName('');
    setImportCommitError(null);
    setImportDuplicateMatches([]);
  }, []);

  const handleCloseImportPreview = useCallback(() => {
    if (isImporting) return;
    resetImportPreview();
  }, [isImporting, resetImportPreview]);

  const handleConfirmImport = useCallback(async () => {
    if (!importPreviewData) return;

    setIsImporting(true);
    setImportCommitError(null);

    try {
      await onCommitGedcomImport({
        persons: importPreviewData.persons,
        families: importPreviewData.families,
      });
      resetImportPreview();
      onClose();
    } catch (err) {
      setImportCommitError(
        err instanceof Error ? err.message : 'Failed to import GEDCOM file'
      );
    } finally {
      setIsImporting(false);
    }
  }, [importPreviewData, onCommitGedcomImport, resetImportPreview, onClose]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError('');
    setInviteMessage('');

    try {
      const result = await onAddMember(inviteEmail.trim(), inviteRole);
      if (result.success) {
        setInviteEmail('');
        setInviteMessage(
          result.pending
            ? 'Invite sent. They will get access when they sign up and verify their email.'
            : 'Member added successfully.'
        );
      } else {
        setInviteError(result.error || 'Failed to add member');
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);
    try {
      await onUpdateTree({ isPublic: !tree.isPublic });
    } catch {
      // Silently fail — the tree state hasn't changed
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleCopyPublicLink = async () => {
    const url = `${window.location.origin}/tree/${tree.id}/public`;
    try {
      await navigator.clipboard.writeText(url);
      setPublicLinkCopied(true);
      window.setTimeout(() => setPublicLinkCopied(false), 2000);
    } catch {
      setExportError('Unable to copy link. Copy the URL from your browser instead.');
    }
  };

  const tabs: { value: SettingsTab; label: string }[] = [
    { value: 'general', label: 'Privacy' },
    { value: 'sharing', label: 'Sharing' },
    { value: 'gedcom', label: 'Import / Export' },
  ];

  const tabCtx = {
    tree, isOwner, isTogglingPublic, handleTogglePublic, publicLinkCopied, handleCopyPublicLink,
    inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviteMessage, inviteError, isInviting, handleInvite,
    members, invites, onUpdateMemberRole, onRemoveMember, onRevokeInvite,
    handleExport, handleExportZip, isExporting, isExportingZip, exportError,
    importInputRef, handleImportFileSelect, isImporting, importParseError,
    persons, relationships,
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tree Settings" size="lg">
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.value
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Privacy tab */}
                {tab === 'general' && <TreeSettingsGeneralTab ctx={tabCtx} />}

        {/* Sharing tab */}
                {tab === 'sharing' && <TreeSettingsSharingTab ctx={tabCtx} />}

        {/* GEDCOM tab */}
                {tab === 'gedcom' && <TreeSettingsGedcomTab ctx={tabCtx} />}
      </div>

      {importPreviewData && (
        <GedcomImportPreviewModal
          isOpen={importPreviewOpen}
          onClose={handleCloseImportPreview}
          onConfirm={handleConfirmImport}
          summary={importPreviewData.summary}
          fileName={importPreviewFileName}
          existingPersonCount={persons.length}
          treeId={tree.id}
          duplicateMatches={importDuplicateMatches}
          loading={isImporting}
          error={importCommitError}
        />
      )}
    </Modal>
  );
}
