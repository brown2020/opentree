'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTreeMembers,
  addTreeMember,
  removeTreeMember,
  updateMemberRole,
} from '@/lib/firebase/members';
import { useAuth } from './useAuth';
import type { TreeMember, MemberRole } from '@/lib/types';

export function useMembers(treeId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!treeId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTreeMembers(treeId);
      setMembers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch members'
      );
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const add = async (
    email: string,
    role: MemberRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!treeId || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const result = await addTreeMember(treeId, email, role, user.uid);
      if (result.success) {
        await fetchMembers();
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
      await removeTreeMember(treeId, userId);
      await fetchMembers();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove member'
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
    loading,
    error,
    refetch: fetchMembers,
    add,
    remove,
    updateRole,
  };
}
