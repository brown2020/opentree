'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Person } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';

interface PersonCardProps {
  person: Person;
  treeId: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PersonCard({
  person,
  treeId,
  isSelected,
  onClick,
}: PersonCardProps) {
  const birthDate = timestampToDate(person.birthDate);
  const deathDate = timestampToDate(person.deathDate);

  const lifespan = (() => {
    if (!birthDate) return null;
    const birth = format(birthDate, 'yyyy');
    if (person.isLiving) return `b. ${birth}`;
    if (deathDate) return `${birth} - ${format(deathDate, 'yyyy')}`;
    return `b. ${birth}`;
  })();

  const initials =
    `${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`.toUpperCase() ||
    '?';

  const genderColor = {
    male: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    female: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div
      onClick={onClick}
      className={`
        flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all
        ${
          isSelected
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
        }
      `}
    >
      {person.profilePhotoUrl ? (
        <Image
          src={person.profilePhotoUrl}
          alt={`${person.firstName} ${person.lastName}`}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-medium ${genderColor[person.gender]}`}
        >
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <Link
          href={`/person/${person.id}?tree=${treeId}`}
          onClick={(e) => e.stopPropagation()}
          className="block truncate font-medium text-gray-900 hover:text-emerald-600 dark:text-gray-100 dark:hover:text-emerald-400"
        >
          {person.firstName} {person.lastName}
          {person.maidenName && (
            <span className="text-gray-500"> (née {person.maidenName})</span>
          )}
        </Link>
        {lifespan && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {lifespan}
          </p>
        )}
      </div>

      {!person.isLiving && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
          Deceased
        </span>
      )}
    </div>
  );
}
