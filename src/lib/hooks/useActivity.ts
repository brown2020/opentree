'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTreeActivity } from '@/lib/firebase/activity';
import type { Activity } from '@/lib/types/activity';

export function useActivity(treeId: string | null, maxItems = 20) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!treeId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getTreeActivity(treeId, maxItems);
      setActivities(data);
    } catch {
      // Silently fail — activity feed is non-critical
    } finally {
      setLoading(false);
    }
  }, [treeId, maxItems]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, loading, refetch: fetchActivity };
}
