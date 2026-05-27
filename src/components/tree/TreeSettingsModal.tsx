'use client';

import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Tree, TreeMember, MemberRole, Person, Relationship } from '@/lib/types';
import { exportToGedcom, downloadGedcom } from '@/lib/utils/gedcom';
import type { ParsedFamily, ParsedPerson } from '@/lib/utils/gedcom';
import { parseGedcomForImport } from '@/lib/utils/gedcomImport';
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
  onUpdateTree: (data: { isPublic?: boolean }) => Promise<void>;
  onAddMember: (email: string, role: MemberRole) => Promise<{ success: boolean; error?: string }>;
  onRemoveMember: (userId: string) => Promise<boolean>;
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
  onUpdateTree,
  onAddMember,
  onRemoveMember,
  onUpdateMemberRole,
  onCommitGedcomImport,
  isOwner,
}: TreeSettingsModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<SettingsTab>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer');
  const [inviteError, setInviteError] = useState('');
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
  const [importCommitError, setImportCommitError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
        setImportPreviewOpen(true);
      } catch (err) {
        setImportParseError(
          err instanceof Error ? err.message : 'Failed to read GEDCOM file'
        );
      }
    },
    []
  );

  const resetImportPreview = useCallback(() => {
    setImportPreviewOpen(false);
    setImportPreviewData(null);
    setImportPreviewFileName('');
    setImportCommitError(null);
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

    try {
      const result = await onAddMember(inviteEmail.trim(), inviteRole);
      if (result.success) {
        setInviteEmail('');
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

  const tabs: { value: SettingsTab; label: string }[] = [
    { value: 'general', label: 'Privacy' },
    { value: 'sharing', label: 'Sharing' },
    { value: 'gedcom', label: 'Import / Export' },
  ];

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
        {tab === 'general' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Public Tree
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {tree.isPublic
                    ? 'Anyone with the link can view this tree.'
                    : 'Only you and invited members can see this tree.'}
                </p>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={!isOwner || isTogglingPublic}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  tree.isPublic ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                } ${!isOwner ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                    tree.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!isOwner && (
              <p className="text-xs text-gray-400">
                Only the tree owner can change privacy settings.
              </p>
            )}
          </div>
        )}

        {/* Sharing tab */}
        {tab === 'sharing' && (
          <div className="space-y-4">
            {isOwner && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Invite Member
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as MemberRole)
                    }
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <Button onClick={handleInvite} loading={isInviting}>
                    Invite
                  </Button>
                </div>
                {inviteError && (
                  <p className="text-sm text-red-500">{inviteError}</p>
                )}
              </div>
            )}

            {/* Members list */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                Members ({members.length})
              </h3>
              {members.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No members yet. Invite someone to collaborate.
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {member.displayName || member.email}
                        </p>
                        {member.displayName && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                onUpdateMemberRole(
                                  member.userId,
                                  e.target.value as MemberRole
                                )
                              }
                              className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                            </select>
                            <button
                              onClick={() => onRemoveMember(member.userId)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove member"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GEDCOM tab */}
        {tab === 'gedcom' && (
          <div className="space-y-6">
            {exportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {exportError}
              </div>
            )}
            {/* Export */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Export GEDCOM
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Download your tree as a GEDCOM 5.5.1 file. This format is
                compatible with most genealogy software.
              </p>
              <Button
                className="mt-3"
                onClick={handleExport}
                loading={isExporting}
                disabled={persons.length === 0}
                variant="outline"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Export to GEDCOM
              </Button>
              {persons.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  Add people to your tree before exporting.
                </p>
              )}
            </div>

            {/* Full ZIP Export */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Full Export (ZIP)
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Download everything — GEDCOM file plus all photos and documents
                organized by person. Your complete tree, portable and backed up.
              </p>
              <Button
                className="mt-3"
                onClick={handleExportZip}
                loading={isExportingZip}
                disabled={persons.length === 0}
                variant="outline"
              >
                <svg
                  className="-ml-1 mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Export as ZIP
              </Button>
            </div>

            {/* Import */}
            {isOwner && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Import GEDCOM
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Import a GEDCOM file to add persons and relationships. You will
                  review a summary before anything is added.
                </p>
                {importParseError && (
                  <div
                    role="alert"
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                  >
                    {importParseError}
                  </div>
                )}
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Choose GEDCOM File
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".ged,.gedcom"
                    onChange={handleImportFileSelect}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {importPreviewData && (
        <GedcomImportPreviewModal
          isOpen={importPreviewOpen}
          onClose={handleCloseImportPreview}
          onConfirm={handleConfirmImport}
          summary={importPreviewData.summary}
          fileName={importPreviewFileName}
          existingPersonCount={persons.length}
          loading={isImporting}
          error={importCommitError}
        />
      )}
    </Modal>
  );
}
