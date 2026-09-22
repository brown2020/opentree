'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSharedTrees, getTreePersonCount } from '@/lib/firebase/firestore';
import { getTreeActivity } from '@/lib/firebase/activity';
import { useActivityStore } from '@/lib/stores/activityStore';
import { timestampToDate } from '@/lib/firebase/firestore';
import type { Tree, Activity } from '@/lib/types';

export interface TreeStats {
  personCount: number;
}

export interface ConsolidatedActivity extends Activity {
  treeName: string;
  treeId: string;
}

export function useDashboardData(userId: string | undefined, trees: Tree[]) {
  const [sharedTrees, setSharedTrees] = useState<Tree[]>([]);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [treeStats, setTreeStats] = useState<Map<string, TreeStats>>(new Map());
  const [consolidatedActivity, setConsolidatedActivity] = useState<ConsolidatedActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const activityBump = useActivityStore((state) => state.bump);

  const allDashboardTrees = useMemo(() => {
    const seen = new Set<string>();
    return [...trees, ...sharedTrees].filter((tree) => {
      if (seen.has(tree.id)) return false;
      seen.add(tree.id);
      return true;
    });
  }, [trees, sharedTrees]);
  const dashboardTreeCount = allDashboardTrees.length;

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setSharedTrees([]);
      setSharedLoading(false);
      return;
    }
    setSharedLoading(true);
    getSharedTrees(userId)
      .then((data) => {
        if (!cancelled) setSharedTrees(data);
      })
      .catch(() => {})
      .finally(() => {
        setSharedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (dashboardTreeCount === 0) {
      setTreeStats(new Map());
      return;
    }

    let cancelled = false;
    const stats = new Map<string, TreeStats>();
    Promise.all(
      allDashboardTrees.map((tree) =>
        getTreePersonCount(tree.id)
          .then((count) => {
            if (!cancelled) stats.set(tree.id, { personCount: count });
          })
          .catch(() => {
            if (!cancelled) stats.set(tree.id, { personCount: 0 });
          })
      )
    ).then(() => {
      if (!cancelled) setTreeStats(new Map(stats));
    });

    return () => {
      cancelled = true;
    };
  }, [allDashboardTrees, dashboardTreeCount]);

  useEffect(() => {
    if (dashboardTreeCount === 0) {
      setConsolidatedActivity([]);
      setActivityLoading(false);
      return;
    }

    let cancelled = false;
    setActivityLoading(true);
    const allActivities: ConsolidatedActivity[] = [];
    Promise.all(
      allDashboardTrees.map((tree) =>
        getTreeActivity(tree.id, 5)
          .then((activities) => {
            for (const a of activities) {
              allActivities.push({ ...a, treeName: tree.name, treeId: tree.id });
            }
          })
          .catch(() => {})
      )
    )
      .then(() => {
        if (cancelled) return;
        allActivities.sort((a, b) => {
          const aTime = timestampToDate(a.timestamp)?.getTime() || 0;
          const bTime = timestampToDate(b.timestamp)?.getTime() || 0;
          return bTime - aTime;
        });
        setConsolidatedActivity(allActivities.slice(0, 10));
      })
      .finally(() => {
        setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [allDashboardTrees, dashboardTreeCount, activityBump]);

  return {
    sharedTrees,
    sharedLoading,
    treeStats,
    allDashboardTrees,
    dashboardTreeCount,
    consolidatedActivity,
    activityLoading,
  };
}
