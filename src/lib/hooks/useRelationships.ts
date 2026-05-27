'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getTreeRelationships,
  addRelationship,
  removeRelationship,
} from '@/lib/firebase/relationships';
import { logTreeActivity } from '@/lib/firebase/activity';
import { useAuth } from './useAuth';
import type { Relationship, RelationshipType } from '@/lib/types';

export function useRelationships(treeId: string | null) {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelationships = useCallback(async () => {
    if (!treeId) {
      setRelationships([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTreeRelationships(treeId);
      setRelationships(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch relationships'
      );
    } finally {
      setLoading(false);
    }
  }, [treeId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!treeId) { setRelationships([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const data = await getTreeRelationships(treeId);
        if (!cancelled) setRelationships(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch relationships');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [treeId]);

  const add = async (
    type: RelationshipType,
    person1Id: string,
    person2Id: string,
    marriageDate?: Date | null,
    divorceDate?: Date | null
  ): Promise<string | null> => {
    if (!treeId) return null;

    try {
      const id = await addRelationship(
        treeId,
        type,
        person1Id,
        person2Id,
        marriageDate,
        divorceDate
      );
      await fetchRelationships();
      if (user) {
        const label = type === 'spouse' ? 'spouse' : 'parent-child';
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'relationship_added',
          `Added ${label} relationship`
        );
      }
      return id;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add relationship'
      );
      return null;
    }
  };

  const remove = async (relationshipId: string): Promise<boolean> => {
    if (!treeId) return false;

    try {
      const existing = relationships.find((rel) => rel.id === relationshipId);
      await removeRelationship(treeId, relationshipId);
      await fetchRelationships();
      if (user) {
        const label =
          existing?.type === 'spouse' ? 'spouse' : 'parent-child';
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'relationship_removed',
          `Removed ${label} relationship`
        );
      }
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove relationship'
      );
      return false;
    }
  };

  return {
    relationships,
    loading,
    error,
    refetch: fetchRelationships,
    add,
    remove,
  };
}
