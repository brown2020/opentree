'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createPerson,
  getPerson,
  getTreePersons,
  updatePerson,
  deletePerson,
} from '@/lib/firebase/firestore';
import { logTreeActivity } from '@/lib/firebase/activity';
import { useAuth } from './useAuth';
import { useTreeStore } from '@/lib/stores/treeStore';
import type { Person } from '@/lib/types';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

export function usePersons(treeId: string | null) {
  const { user } = useAuth();
  const { setPersons } = useTreeStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersons = useCallback(async () => {
    if (!treeId) {
      setPersons([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getTreePersons(treeId);
      setPersons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch persons');
    } finally {
      setLoading(false);
    }
  }, [treeId, setPersons]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!treeId) { setPersons([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const data = await getTreePersons(treeId);
        if (!cancelled) setPersons(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch persons');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [treeId, setPersons]);

  const create = async (data: PersonSchemaFormData): Promise<string | null> => {
    if (!treeId) return null;

    try {
      const id = await createPerson(treeId, data);
      await fetchPersons();
      if (user) {
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'person_added',
          `Added ${data.firstName} ${data.lastName}`,
          id
        );
      }
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
      return null;
    }
  };

  const update = async (
    personId: string,
    data: Partial<PersonSchemaFormData>
  ): Promise<boolean> => {
    if (!treeId) return false;

    try {
      const existing = await getPerson(treeId, personId);
      await updatePerson(treeId, personId, data);
      await fetchPersons();
      if (user) {
        const firstName = data.firstName ?? existing?.firstName ?? 'Person';
        const lastName = data.lastName ?? existing?.lastName ?? '';
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'person_updated',
          `Updated ${firstName} ${lastName}`.trim(),
          personId
        );
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
      return false;
    }
  };

  const remove = async (personId: string): Promise<boolean> => {
    if (!treeId) return false;

    try {
      const existing = await getPerson(treeId, personId);
      await deletePerson(treeId, personId);
      await fetchPersons();
      if (user && existing) {
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'person_deleted',
          `Removed ${existing.firstName} ${existing.lastName}`,
          personId
        );
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete person');
      return false;
    }
  };

  return {
    loading,
    error,
    refetch: fetchPersons,
    create,
    update,
    remove,
  };
}

export function usePersonDetails(treeId: string | null, personId: string | null) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerson = useCallback(async () => {
    if (!treeId || !personId) {
      setPerson(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPerson(treeId, personId);
      setPerson(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch person');
    } finally {
      setLoading(false);
    }
  }, [treeId, personId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!treeId || !personId) { setPerson(null); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const data = await getPerson(treeId, personId);
        if (!cancelled) setPerson(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch person');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [treeId, personId]);

  return {
    person,
    loading,
    error,
    refetch: fetchPerson,
  };
}
