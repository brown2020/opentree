'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OnboardingCreatingStep({ ctx }: { ctx: UiCtx }) {
  const {
    treeName, setTreeName, self, setSelf, father, setFather, mother, setMother,
    setStep, error, handleFinish, hasFather, hasMother, canProceedTree, canProceedSelf,
  } = ctx;
  return (

        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Creating your family tree...
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This will just take a moment.
          </p>
        </div>
      
  );
}
