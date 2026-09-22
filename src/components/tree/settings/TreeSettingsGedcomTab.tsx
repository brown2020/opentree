'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MemberRole } from '@/lib/types';

export function TreeSettingsGedcomTab({ ctx }: { ctx: UiCtx }) {
  const {
    tree, isOwner, isTogglingPublic, handleTogglePublic, publicLinkCopied, handleCopyPublicLink,
    inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviteMessage, inviteError, isInviting, handleInvite,
    members, invites, onUpdateMemberRole, onRemoveMember, onRevokeInvite,
    handleExport, handleExportZip, isExporting, isExportingZip, exportError,
    importInputRef, handleImportFileSelect, isImporting, importParseError,
    persons, relationships,
  } = ctx;
  return (

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
        
  );
}
