'use client';

import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PersonDetailView } from '@/components/person/PersonDetailView';
import { usePersonDetailModel } from '@/lib/hooks/usePersonDetailModel';

function PersonDetailContent() {
  const model = usePersonDetailModel();

  if (model.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (model.status === 'notfound') {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Person not found</p>
      </div>
    );
  }

  return <PersonDetailView ctx={model.ctx} />;
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
