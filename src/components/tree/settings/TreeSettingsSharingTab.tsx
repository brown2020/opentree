'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { MemberRole } from '@/lib/types';

export function TreeSettingsSharingTab({ ctx }: { ctx: UiCtx }) {
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
                    aria-label="Invite access level"
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
                {inviteMessage && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
                    {inviteMessage}
                  </p>
                )}
                {inviteError && (
                  <p className="text-sm text-red-500">{inviteError}</p>
                )}
              </div>
            )}

            {isOwner && invites.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Pending invites ({invites.length})
                </h3>
                <div className="space-y-2">
                  {invites.map((invite: UiCtx) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {invite.email}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Pending · {invite.accessLevel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRevokeInvite(invite.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
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
                  {members.map((member: UiCtx) => (
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
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          Active
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner ? (
                          <>
                            <select
                              aria-label={`Access level for ${member.displayName || member.email}`}
                              value={member.accessLevel}
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
                            {member.accessLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        
  );
}
