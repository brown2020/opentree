'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { SimilarPersonMatch } from '@/lib/utils/duplicatePerson';

interface DuplicatePersonWarningProps {
  matches: SimilarPersonMatch[];
  treeId: string;
  onContinue: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DuplicatePersonWarning({
  matches,
  treeId,
  onContinue,
  onCancel,
  loading = false,
}: DuplicatePersonWarningProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
        Possible duplicate{matches.length > 1 ? 's' : ''} found
      </h3>
      <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
        Someone with a similar name and birth year may already be in this tree.
      </p>
      <ul className="mt-3 space-y-2">
        {matches.map(({ person, birthYear }) => (
          <li key={person.id} className="text-sm">
            <Link
              href={`/person/${person.id}?tree=${treeId}`}
              className="font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              View possible duplicate: {person.firstName} {person.lastName}
              {birthYear != null ? ` (b. ${birthYear})` : ''}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Go back
        </Button>
        <Button type="button" onClick={onContinue} loading={loading}>
          Add anyway
        </Button>
      </div>
    </div>
  );
}
