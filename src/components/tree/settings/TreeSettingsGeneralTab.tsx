'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MemberRole } from '@/lib/types';

export function TreeSettingsGeneralTab({ ctx }: { ctx: UiCtx }) {
  const {
    tree, isOwner, isTogglingPublic, handleTogglePublic, publicLinkCopied, handleCopyPublicLink,
    inviteEmail, setInviteEmail, inviteRole, setInviteRole, inviteMessage, inviteError, isInviting, handleInvite,
    members, invites, onUpdateMemberRole, onRemoveMember, onRevokeInvite,
    handleExport, handleExportZip, isExporting, isExportingZip, exportError,
    importInputRef, handleImportFileSelect, isImporting, importParseError,
    persons, relationships,
  } = ctx;
  return (

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
                type="button"
                role="switch"
                aria-checked={tree.isPublic}
                aria-label="Make tree public"
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

            {tree.isPublic && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Public viewing link
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Anyone with this link can browse the tree without signing in.
                  Living persons show limited details.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    /tree/{tree.id}/public
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPublicLink}
                  >
                    {publicLinkCopied ? 'Copied!' : 'Copy link'}
                  </Button>
                </div>
              </div>
            )}

            {!isOwner && (
              <p className="text-xs text-gray-400">
                Only the tree owner can change privacy settings.
              </p>
            )}
          </div>
        
  );
}
