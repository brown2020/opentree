'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import type { Tree } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';

interface TreeCardProps {
  tree: Tree;
  onDelete: (tree: Tree) => void;
}

export function TreeCard({ tree, onDelete }: TreeCardProps) {
  const updatedAt = timestampToDate(tree.updatedAt);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <svg
            className="h-6 w-6"
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
        <button
          onClick={() => onDelete(tree)}
          className="rounded-lg p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-gray-700"
          title="Delete tree"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <Link href={`/tree/${tree.id}`}>
        <h3 className="mb-1 text-lg font-semibold text-gray-900 hover:text-emerald-600 dark:text-gray-100 dark:hover:text-emerald-400">
          {tree.name}
        </h3>
      </Link>

      {tree.description && (
        <p className="mb-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
          {tree.description}
        </p>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Updated {updatedAt ? format(updatedAt, 'MMM d, yyyy') : 'recently'}
      </p>
    </div>
  );
}
