'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

export function FamilyTreeControls({ ctx }: { ctx: UiCtx }) {
  const {
    handleZoomIn, handleZoomOut, handleFitAll, handleResetView, effectiveRoot, persons,
  } = ctx;
  return (
<>
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Zoom in"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Zoom out"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={handleFitAll}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Fit all"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-black/5 hover:bg-gray-50 dark:bg-gray-700 dark:ring-white/10 dark:hover:bg-gray-600"
          title="Reset view"
        >
          <svg className="h-4 w-4 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0zm9-4v4m0 0H8m4 0h4" />
          </svg>
        </button>
      </div>
      {/* Root person indicator */}
      {effectiveRoot && (() => {
        const rootPerson = persons.find((p: UiCtx) => p.id === effectiveRoot);
        return rootPerson ? (
          <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/90 dark:text-gray-300 dark:ring-white/10">
            Centered on:{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {rootPerson.firstName} {rootPerson.lastName}
            </span>
          </div>
        ) : null;
      })()}
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs text-gray-500 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-gray-800/90 dark:text-gray-400 dark:ring-white/10">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded bg-gray-400 dark:bg-gray-500" />
          Parent-Child
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-pink-400 dark:border-pink-300" />
          Spouse
        </span>
      </div>
</>
  );
}

