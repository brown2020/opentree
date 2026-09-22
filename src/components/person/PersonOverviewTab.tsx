'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { PersonKeyFacts } from '@/components/person/PersonKeyFacts';
import { PersonRelationshipsPanel } from '@/components/person/PersonRelationshipsPanel';

export function PersonOverviewTab({ ctx }: { ctx: UiCtx }) {
  const { activeTab, showFullDetails, displayPerson } = ctx;
  if (activeTab !== 'overview') return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {!showFullDetails && displayPerson.isLiving && (
        <div className="lg:col-span-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          This living person&apos;s details are limited on public trees. Only the tree owner and members see full details.
        </div>
      )}
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Biography</h2>
          {!showFullDetails && displayPerson.isLiving ? (
            <p className="text-gray-500 dark:text-gray-400">
              Biography is not available for living persons on public trees.
            </p>
          ) : displayPerson.bio ? (
            <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{displayPerson.bio}</p>
          ) : (
            <p className="italic text-gray-400 dark:text-gray-500">No biography added yet.</p>
          )}
        </div>
      </div>
      <PersonKeyFacts ctx={ctx} />
      <PersonRelationshipsPanel ctx={ctx} />
    </div>
  );
}
