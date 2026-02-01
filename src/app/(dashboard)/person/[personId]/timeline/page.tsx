'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePersonDetails } from '@/lib/hooks/usePerson';
import { TimelineView } from '@/components/person/TimelineView';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PersonTimelinePage() {
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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href={`/person/${personId}?tree=${treeId}`}
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
        Back to {person.firstName}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Timeline for {person.firstName} {person.lastName}
      </h1>

      <TimelineView treeId={treeId} personId={personId} />
    </div>
  );
}
