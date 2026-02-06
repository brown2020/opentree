'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { usePersonDetails } from '@/lib/hooks/usePerson';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { timestampToDate } from '@/lib/firebase/firestore';

function PersonDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const personId = params.personId as string;
  const treeId = searchParams.get('tree');

  const { person, loading } = usePersonDetails(treeId, personId);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!person || !treeId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Person not found</p>
      </div>
    );
  }

  const birthDate = timestampToDate(person.birthDate);
  const deathDate = timestampToDate(person.deathDate);

  const genderColor = {
    male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const initials =
    `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase() ||
    '?';

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href={`/tree/${treeId}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to tree
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        {person.profilePhotoUrl ? (
          <Image
            src={person.profilePhotoUrl}
            alt={`${person.firstName} ${person.lastName}`}
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white shadow-lg dark:ring-gray-800"
          />
        ) : (
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-white shadow-lg dark:ring-gray-800 ${genderColor[person.gender]}`}
          >
            {initials}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {person.firstName} {person.middleName} {person.lastName}
            {person.maidenName && (
              <span className="text-gray-500"> (née {person.maidenName})</span>
            )}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-500 dark:text-gray-400">
            {birthDate && (
              <span>Born {format(birthDate, 'MMMM d, yyyy')}</span>
            )}
            {!person.isLiving && deathDate && (
              <span>Died {format(deathDate, 'MMMM d, yyyy')}</span>
            )}
            {!person.isLiving && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                Deceased
              </span>
            )}
          </div>
        </div>

        <Link href={`/person/${personId}/edit?tree=${treeId}`}>
          <Button variant="outline">
            <svg
              className="-ml-1 mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit
          </Button>
        </Link>
      </div>

      {/* Info sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Biography
            </h2>
            {person.bio ? (
              <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">
                {person.bio}
              </p>
            ) : (
              <p className="italic text-gray-400 dark:text-gray-500">
                No biography added yet.
              </p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <Link
            href={`/person/${personId}/photos?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Photos
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                View and manage photos
              </p>
            </div>
          </Link>

          <Link
            href={`/person/${personId}/documents?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Documents
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Birth certificates, records
              </p>
            </div>
          </Link>

          <Link
            href={`/person/${personId}/timeline?tree=${treeId}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Timeline
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Life events and milestones
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PersonDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <PersonDetailContent />
    </Suspense>
  );
}
