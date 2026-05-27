'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTreeMembers,
  getTreeInvites,
  addTreeMember,
  removeTreeMember,
  updateMemberRole,
  revokeTreeInvite,
} from '@/lib/firebase/members';
import { logTreeActivity } from '@/lib/firebase/activity';
import { useAuth } from './useAuth';
import type { TreeMember, TreeInvite, MemberRole } from '@/lib/types';
import type { AddTreeMemberResult } from '@/lib/firebase/members';

export function useMembers(treeId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [invites, setInvites] = useState<TreeInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!treeId) {
      setMembers([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [memberData, inviteData] = await Promise.all([
        getTreeMembers(treeId),
        getTreeInvites(treeId),
      ]);
      setMembers(memberData);
      setInvites(inviteData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch members'
      );
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!treeId) {
        setMembers([]);
        setInvites([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [memberData, inviteData] = await Promise.all([
          getTreeMembers(treeId),
          getTreeInvites(treeId),
        ]);
        if (!cancelled) {
          setMembers(memberData);
          setInvites(inviteData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch members');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  const add = async (
    email: string,
    role: MemberRole
  ): Promise<AddTreeMemberResult> => {
    if (!treeId || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const result = await addTreeMember(treeId, email, role, user.uid);
      if (result.success) {
        await fetchMembers();
        if (result.pending) {
          await logTreeActivity(
            treeId,
            { userId: user.uid, userDisplayName: user.displayName },
            'member_added',
            `Invited ${email.trim().toLowerCase()} (pending)`
          );
        } else {
          await logTreeActivity(
            treeId,
            { userId: user.uid, userDisplayName: user.displayName },
            'member_added',
            `Added ${email.trim().toLowerCase()} as ${role}`
          );
        }
      }
      return result;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add member';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const remove = async (userId: string): Promise<boolean> => {
    if (!treeId) return false;

    try {
      const member = members.find((m) => m.userId === userId);
      await removeTreeMember(treeId, userId);
      await fetchMembers();
      if (user && member) {
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'member_removed',
          `Removed ${member.displayName || member.email}`
        );
      }
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove member'
      );
      return false;
    }
  };

  const revokeInvite = async (inviteId: string): Promise<boolean> => {
    if (!treeId) return false;

    try {
      await revokeTreeInvite(treeId, inviteId);
      await fetchMembers();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to revoke invite'
      );
      return false;
    }
  };

  const updateRole = async (
    userId: string,
    role: MemberRole
  ): Promise<boolean> => {
    if (!treeId) return false;

    try {
      await updateMemberRole(treeId, userId, role);
      await fetchMembers();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update role'
      );
      return false;
    }
  };

  return {
    members,
    invites,
    loading,
    error,
    refetch: fetchMembers,
    add,
    remove,
    revokeInvite,
    updateRole,
  };
}
