'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logTreeActivity } from '@/lib/firebase/activity';
import { useAuth } from './useAuth';
import type { PersonEvent, EventFormData } from '@/lib/types';

export function useTimeline(treeId: string | null, personId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<PersonEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!treeId || !personId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'trees', treeId, 'persons', personId, 'events'),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PersonEvent[];
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [treeId, personId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!treeId || !personId) { setEvents([]); setLoading(false); return; }
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'trees', treeId, 'persons', personId, 'events'),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as PersonEvent[];
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [treeId, personId]);

  const create = async (data: EventFormData): Promise<string | null> => {
    if (!treeId || !personId) return null;

    try {
      const docRef = await addDoc(
        collection(db, 'trees', treeId, 'persons', personId, 'events'),
        {
          type: data.type,
          title: data.title,
          description: data.description || null,
          date: Timestamp.fromDate(data.date),
          endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
          place: data.place || null,
          createdAt: serverTimestamp(),
        }
      );
      await fetchEvents();
      if (user) {
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'event_added',
          `Added event: ${data.title}`,
          personId
        );
      }
      return docRef.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    }
  };

  const update = async (
    eventId: string,
    data: Partial<EventFormData>
  ): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      const updateData: Record<string, unknown> = { ...data };
      if (data.date !== undefined) {
        updateData.date = Timestamp.fromDate(data.date);
      }
      if (data.endDate !== undefined) {
        updateData.endDate = data.endDate
          ? Timestamp.fromDate(data.endDate)
          : null;
      }

      await updateDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'events', eventId),
        updateData
      );
      await fetchEvents();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      return false;
    }
  };

  const remove = async (eventId: string): Promise<boolean> => {
    if (!treeId || !personId) return false;

    try {
      const existing = events.find((event) => event.id === eventId);
      await deleteDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'events', eventId)
      );
      await fetchEvents();
      if (user) {
        await logTreeActivity(
          treeId,
          { userId: user.uid, userDisplayName: user.displayName },
          'event_deleted',
          existing
            ? `Removed event: ${existing.title}`
            : 'Removed a timeline event',
          personId
        );
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      return false;
    }
  };

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    create,
    update,
    remove,
  };
}
