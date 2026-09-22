'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { RelationSection } from '@/components/person/RelationSection';

export function PersonRelationshipsPanel({ ctx }: { ctx: UiCtx }) {
  const {
    treeId, hasRelationships, related, setRelModalOpen, getDisplayPerson, setQuickAddType,
  } = ctx;
  return (
    <>
          {/* Relationships — full width */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Family
                </h2>
                <button
                  onClick={() => setRelModalOpen(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  + Add
                </button>
              </div>

              {!hasRelationships ? (
                <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No relationships added yet.
                  </p>
                  <button
                    onClick={() => setRelModalOpen(true)}
                    className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Add a relationship
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.parents.length > 0 && (
                    <RelationSection title="Parents" persons={related.parents} treeId={treeId} onQuickAdd={() => setQuickAddType('parent')} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.parents.length === 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Parents</h3>
                        <button onClick={() => setQuickAddType('parent')} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">+ Add</button>
                      </div>
                      <p className="text-xs italic text-gray-400">No parents added</p>
                    </div>
                  )}
                  {related.spouses.length > 0 && (
                    <RelationSection title="Spouse(s)" persons={related.spouses} treeId={treeId} onQuickAdd={() => setQuickAddType('spouse')} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.stepParents.length > 0 && (
                    <RelationSection title="Step-Parents" persons={related.stepParents} treeId={treeId} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.siblings.length > 0 && (
                    <RelationSection title="Siblings" persons={related.siblings} treeId={treeId} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.stepSiblings.length > 0 && (
                    <RelationSection title="Step-Siblings" persons={related.stepSiblings} treeId={treeId} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.children.length > 0 && (
                    <RelationSection title="Children" persons={related.children} treeId={treeId} onQuickAdd={() => setQuickAddType('child')} getDisplayPerson={getDisplayPerson} />
                  )}
                  {related.children.length === 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Children</h3>
                        <button onClick={() => setQuickAddType('child')} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">+ Add</button>
                      </div>
                      <p className="text-xs italic text-gray-400">No children added</p>
                    </div>
                  )}
                  {related.stepChildren.length > 0 && (
                    <RelationSection title="Step-Children" persons={related.stepChildren} treeId={treeId} getDisplayPerson={getDisplayPerson} />
                  )}
                </div>
              )}
            </div>
          </div>
    </>
  );
}
