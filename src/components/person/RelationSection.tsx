'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Person } from '@/lib/types';

export function RelationSection({
  title,
  persons,
  treeId,
  onQuickAdd,
  getDisplayPerson,
}: {
  title: string;
  persons: Person[];
  treeId: string;
  onQuickAdd?: () => void;
  getDisplayPerson: (person: Person) => Person;
}) {
  const genderColors: Record<string, string> = {
    male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {onQuickAdd && (
          <button onClick={onQuickAdd} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            + Add
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {persons.map((p) => {
          const display = getDisplayPerson(p);
          return (
          <Link
            key={p.id}
            href={`/person/${p.id}?tree=${treeId}`}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/10"
          >
            {display.profilePhotoUrl ? (
              <Image
                src={display.profilePhotoUrl}
                alt={`${display.firstName} ${display.lastName}`}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${genderColors[p.gender] || genderColors.unknown}`}
              >
                {display.firstName?.[0]}
              </span>
            )}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {display.firstName} {display.lastName}
            </span>
          </Link>
        );})}
      </div>
    </div>
  );
}
