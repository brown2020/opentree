'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { format } from 'date-fns';
import Link from 'next/link';

export function PersonKeyFacts({ ctx }: { ctx: UiCtx }) {
  const {
    displayPerson, birthDate, deathDate, computedAge, showFullDetails,
    treeId, related, marriageDates, canViewFullPerson, getDisplayPerson, person,
  } = ctx;
  return (
    <>
          {/* Key Facts sidebar */}
          <div>
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Facts
              </h2>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Gender</dt>
                  <dd className="font-medium capitalize text-gray-900 dark:text-gray-100">
                    {displayPerson.gender}
                  </dd>
                </div>
                {birthDate && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Birth</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {format(birthDate, 'MMMM d, yyyy')}
                      {computedAge !== null && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({displayPerson.isLiving ? `age ${computedAge}` : `age ${computedAge} at death`})
                        </span>
                      )}
                    </dd>
                    {displayPerson.birthPlace && (
                      <dd className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {displayPerson.birthPlace}
                      </dd>
                    )}
                  </div>
                )}
                {!displayPerson.isLiving && deathDate && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Death</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">
                      {format(deathDate, 'MMMM d, yyyy')}
                    </dd>
                    {displayPerson.deathPlace && (
                      <dd className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {displayPerson.deathPlace}
                      </dd>
                    )}
                  </div>
                )}
                {showFullDetails && related.spouses.length > 0 && (
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">
                      {related.spouses.length === 1 ? 'Marriage' : 'Marriages'}
                    </dt>
                    {related.spouses.map((sp: UiCtx) => {
                      const displaySpouse = getDisplayPerson(sp);
                      return (
                      <dd key={sp.id} className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                        <Link href={`/person/${sp.id}?tree=${treeId}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
                          {displaySpouse.firstName} {displaySpouse.lastName}
                        </Link>
                        {marriageDates.get(sp.id) && canViewFullPerson(sp) && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({marriageDates.get(sp.id)})
                          </span>
                        )}
                      </dd>
                    );})}
                  </div>
                )}
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-100">
                    {displayPerson.isLiving ? 'Living' : 'Deceased'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

    </>
  );
}
