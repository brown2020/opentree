'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTrees } from '@/lib/hooks/useTree';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSharedTrees, getTreePersonCount } from '@/lib/firebase/firestore';
import { getTreeActivity } from '@/lib/firebase/activity';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { TreeCard } from '@/components/tree/TreeCard';
import { CreateTreeModal } from '@/components/tree/CreateTreeModal';
import { OnboardingWizard } from '@/components/tree/OnboardingWizard';
import type { Tree, Activity } from '@/lib/types';
import type { TreeSchemaFormData } from '@/lib/utils/validation';
import { timestampToDate } from '@/lib/firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

interface TreeStats {
  personCount: number;
}

interface ConsolidatedActivity extends Activity {
  treeName: string;
  treeId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { trees, loading, error, create, remove } = useTrees();
  const [sharedTrees, setSharedTrees] = useState<Tree[]>([]);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTree, setDeleteTree] = useState<Tree | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [treeStats, setTreeStats] = useState<Map<string, TreeStats>>(new Map());
  const [consolidatedActivity, setConsolidatedActivity] = useState<ConsolidatedActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const fetchSharedTrees = useCallback(async () => {
    if (!user) {
      setSharedTrees([]);
      setSharedLoading(false);
      return;
    }

    try {
      const data = await getSharedTrees(user.uid);
      setSharedTrees(data);
    } catch {
      // Non-critical
    } finally {
      setSharedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSharedTrees();
  }, [fetchSharedTrees]);

  // Fetch person counts for each tree
  useEffect(() => {
    if (trees.length === 0) return;

    const fetchStats = async () => {
      const stats = new Map<string, TreeStats>();
      await Promise.all(
        trees.map(async (tree) => {
          try {
            const count = await getTreePersonCount(tree.id);
            stats.set(tree.id, { personCount: count });
          } catch {
            stats.set(tree.id, { personCount: 0 });
          }
        })
      );
      setTreeStats(stats);
    };

    fetchStats();
  }, [trees]);

  // Fetch consolidated activity across all trees
  useEffect(() => {
    if (trees.length === 0) {
      setActivityLoading(false);
      return;
    }

    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const allActivities: ConsolidatedActivity[] = [];
        await Promise.all(
          trees.map(async (tree) => {
            try {
              const activities = await getTreeActivity(tree.id, 5);
              for (const a of activities) {
                allActivities.push({ ...a, treeName: tree.name, treeId: tree.id });
              }
            } catch {
              // Non-critical
            }
          })
        );

        allActivities.sort((a, b) => {
          const aTime = timestampToDate(a.timestamp)?.getTime() || 0;
          const bTime = timestampToDate(b.timestamp)?.getTime() || 0;
          return bTime - aTime;
        });

        setConsolidatedActivity(allActivities.slice(0, 10));
      } catch {
        // Non-critical
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [trees]);

  const handleCreateTree = async (data: TreeSchemaFormData) => {
    setIsCreating(true);
    const treeId = await create(data);
    setIsCreating(false);

    if (treeId) {
      setCreateModalOpen(false);
      router.push(`/tree/${treeId}`);
    }
  };

  const handleDeleteTree = async () => {
    if (!deleteTree) return;

    setIsDeleting(true);
    await remove(deleteTree.id);
    setIsDeleting(false);
    setDeleteTree(null);
  };

  // Sort trees by updatedAt descending
  const sortedTrees = [...trees].sort((a, b) => {
    const aTime = timestampToDate(a.updatedAt)?.getTime() || 0;
    const bTime = timestampToDate(b.updatedAt)?.getTime() || 0;
    return bTime - aTime;
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="mb-4 text-red-500">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {getGreeting()}, {user?.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {trees.length === 0
              ? 'Get started by creating your first family tree'
              : `You have ${trees.length} family tree${trees.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Tree
        </Button>
      </div>

      {trees.length === 0 && sharedTrees.length === 0 ? (
        <OnboardingWizard />
      ) : (
        <div className="space-y-8">
          {/* Owned trees */}
          {sortedTrees.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                My Trees
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedTrees.map((tree) => (
                  <TreeCard
                    key={tree.id}
                    tree={tree}
                    onDelete={setDeleteTree}
                    personCount={treeStats.get(tree.id)?.personCount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shared trees */}
          {!sharedLoading && sharedTrees.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Shared with Me
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sharedTrees.map((tree) => (
                  <TreeCard
                    key={tree.id}
                    tree={tree}
                    isShared
                  />
                ))}
              </div>
            </div>
          )}

          {/* Consolidated recent activity */}
          {consolidatedActivity.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h2>
              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {activityLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {consolidatedActivity.map((a) => {
                      const ts = timestampToDate(a.timestamp);
                      return (
                        <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {a.description}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">{a.treeName}</span>
                              {ts && (
                                <> &middot; {formatDistanceToNow(ts, { addSuffix: true })}</>
                              )}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateTreeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateTree}
        loading={isCreating}
      />

      <ConfirmModal
        isOpen={!!deleteTree}
        onClose={() => setDeleteTree(null)}
        onConfirm={handleDeleteTree}
        title="Delete Family Tree"
        message={`Are you sure you want to delete "${deleteTree?.name}"? This will permanently delete all people, photos, and documents in this tree. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isDeleting}
      />
    </div>
  );
}
