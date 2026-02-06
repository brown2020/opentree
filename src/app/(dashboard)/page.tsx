'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTrees } from '@/lib/hooks/useTree';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSharedTrees } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { TreeCard } from '@/components/tree/TreeCard';
import { CreateTreeModal } from '@/components/tree/CreateTreeModal';
import { OnboardingWizard } from '@/components/tree/OnboardingWizard';
import { ActivityFeed } from '@/components/tree/ActivityFeed';
import type { Tree } from '@/lib/types';
import type { TreeSchemaFormData } from '@/lib/utils/validation';

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
      // Silently fail for shared trees
    } finally {
      setSharedLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSharedTrees();
  }, [fetchSharedTrees]);

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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Family Trees
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage your family trees
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
          {trees.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trees.map((tree) => (
                <TreeCard key={tree.id} tree={tree} onDelete={setDeleteTree} />
              ))}
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

          {/* Recent activity per tree */}
          {trees.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {trees.map((tree) => (
                  <div
                    key={tree.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >
                    <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tree.name}
                    </h3>
                    <ActivityFeed treeId={tree.id} />
                  </div>
                ))}
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
