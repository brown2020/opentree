'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePersonDetails, usePersons } from '@/lib/hooks/usePerson';
import { PersonForm } from '@/components/person/PersonForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

function EditPersonContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const personId = params.personId as string;
  const treeId = searchParams.get('tree');

  const { person, loading } = usePersonDetails(treeId, personId);
  const { update } = usePersons(treeId);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: PersonSchemaFormData) => {
    if (!treeId) return;
    setIsSaving(true);
    try {
      await update(personId, data);
      router.push(`/person/${personId}?tree=${treeId}`);
    } catch {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/person/${personId}?tree=${treeId}`);
  };

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
    <div className="mx-auto max-w-2xl">
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
        Edit {person.firstName} {person.lastName}
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <PersonForm
          person={person}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={isSaving}
        />
      </div>
    </div>
  );
}

export default function EditPersonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <EditPersonContent />
    </Suspense>
  );
}
