'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OnboardingParentsStep({ ctx }: { ctx: UiCtx }) {
  const {
    treeName, setTreeName, self, setSelf, father, setFather, mother, setMother,
    setStep, error, handleFinish, hasFather, hasMother, canProceedTree, canProceedSelf,
  } = ctx;
  return (

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <svg className="h-8 w-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Add your parents
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Optional — you can skip this and add them later from the tree view.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Father */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  F
                </span>
                Father
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={father.firstName}
                  onChange={(e) => setFather({ ...father, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last name"
                  value={father.lastName}
                  onChange={(e) => setFather({ ...father, lastName: e.target.value })}
                />
              </div>
              <div className="mt-3">
                <Input
                  label="Birth Date (optional)"
                  type="date"
                  value={father.birthDate}
                  onChange={(e) => setFather({ ...father, birthDate: e.target.value })}
                />
              </div>
            </div>

            {/* Mother */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
                  M
                </span>
                Mother
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={mother.firstName}
                  onChange={(e) => setMother({ ...mother, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last name"
                  value={mother.lastName}
                  onChange={(e) => setMother({ ...mother, lastName: e.target.value })}
                />
              </div>
              <div className="mt-3">
                <Input
                  label="Birth Date (optional)"
                  type="date"
                  value={mother.birthDate}
                  onChange={(e) => setMother({ ...mother, birthDate: e.target.value })}
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleFinish}>
              {hasFather || hasMother
                ? 'Create Tree'
                : 'Skip & Create Tree'}
            </Button>
          </div>
        </div>
      
  );
}
