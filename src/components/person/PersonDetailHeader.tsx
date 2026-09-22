'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export function PersonDetailHeader({ ctx }: { ctx: UiCtx }) {
  const {
    treeId, tree, person, personId, displayPerson, birthDate, deathDate, computedAge,
    genderColor, initials, tabs, activeTab, setActiveTab, setRelModalOpen,
  } = ctx;
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200">
          Dashboard
        </Link>
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/tree/${treeId}`} className="hover:text-gray-700 dark:hover:text-gray-200">
          {tree?.name || 'Tree'}
        </Link>
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="truncate font-medium text-gray-900 dark:text-gray-100">
          {person.firstName} {person.lastName}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {displayPerson.profilePhotoUrl ? (
          <Image
            src={displayPerson.profilePhotoUrl}
            alt={`${displayPerson.firstName} ${displayPerson.lastName}`}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg dark:ring-gray-800"
          />
        ) : (
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-white shadow-lg dark:ring-gray-800 ${genderColor[displayPerson.gender]}`}
          >
            {initials}
          </div>
        )}

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {displayPerson.firstName} {displayPerson.middleName} {displayPerson.lastName}
              {displayPerson.maidenName && (
                <span className="text-gray-500"> (nee {displayPerson.maidenName})</span>
              )}
            </h1>
            {displayPerson.isLiving ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Living
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Deceased
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400">
            {birthDate && (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Born {format(birthDate, 'MMMM d, yyyy')}
              </span>
            )}
            {!person.isLiving && deathDate && (
              <span className="flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Died {format(deathDate, 'MMMM d, yyyy')}
              </span>
            )}
            {computedAge !== null && (
              <span className="text-sm">
                {displayPerson.isLiving ? `Age ${computedAge}` : `Lived to ${computedAge}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRelModalOpen(true)}>
            <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Add Relationship
          </Button>
          <Link href={`/person/${personId}/edit?tree=${treeId}`}>
            <Button variant="outline" size="sm">
              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Person sections">
          {tabs.map((tab: UiCtx) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

    </>
  );
}
