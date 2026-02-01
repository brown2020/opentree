'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createTree,
  getTree,
  getUserTrees,
  updateTree,
  deleteTree,
} from '@/lib/firebase/firestore';
import { useAuth } from './useAuth';
import type { Tree, TreeFormData } from '@/lib/types';

export function useTrees() {
  const { user } = useAuth();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrees = useCallback(async () => {
    if (!user) {
      setTrees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserTrees(user.uid);
      setTrees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trees');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrees();
  }, [fetchTrees]);

  const create = async (data: TreeFormData): Promise<string | null> => {
    if (!user) return null;

    try {
      const id = await createTree(user.uid, data);
      await fetchTrees();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tree');
      return null;
    }
  };

  const update = async (
    treeId: string,
    data: Partial<TreeFormData>
  ): Promise<boolean> => {
    try {
      await updateTree(treeId, data);
      await fetchTrees();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tree');
      return false;
    }
  };

  const remove = async (treeId: string): Promise<boolean> => {
    try {
      await deleteTree(treeId);
      await fetchTrees();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tree');
      return false;
    }
  };

  return {
    trees,
    loading,
    error,
    refetch: fetchTrees,
    create,
    update,
    remove,
  };
}

export function useTreeDetails(treeId: string | null) {
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    if (!treeId) {
      setTree(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTree(treeId);
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tree');
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return {
    tree,
    loading,
    error,
    refetch: fetchTree,
  };
}
