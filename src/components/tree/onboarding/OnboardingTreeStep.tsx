'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OnboardingTreeStep({ ctx }: { ctx: UiCtx }) {
  const {
    treeName, setTreeName, self, setSelf, father, setFather, mother, setMother,
    setStep, error, handleFinish, hasFather, hasMother, canProceedTree, canProceedSelf,
  } = ctx;
  return (

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Let&apos;s start your family tree
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Give your tree a name. You can always change it later.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Tree Name"
              placeholder={'e.g., "The Smith Family" or "Mom\'s Side"'}
              value={treeName}
              onChange={(e) => setTreeName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canProceedTree) setStep('yourself');
              }}
            />

            <Button
              className="w-full"
              onClick={() => setStep('yourself')}
              disabled={!canProceedTree}
            >
              Continue
            </Button>
          </div>
        </div>
      
  );
}
