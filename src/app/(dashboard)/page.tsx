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
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 dark:border-gray-600 dark:bg-gray-800/50">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            No family trees yet
          </h3>
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Create your first family tree to start documenting your heritage.
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            Create Your First Tree
          </Button>
        </div>
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
