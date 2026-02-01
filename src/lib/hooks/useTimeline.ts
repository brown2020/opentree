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
import type { PersonEvent, EventFormData } from '@/lib/types';

export function useTimeline(treeId: string | null, personId: string | null) {
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
    fetchEvents();
  }, [fetchEvents]);

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
      await deleteDoc(
        doc(db, 'trees', treeId, 'persons', personId, 'events', eventId)
      );
      await fetchEvents();
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
