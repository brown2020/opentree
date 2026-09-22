'use client';

import type { UiCtx } from '@/lib/types/uiCtx';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function OnboardingYourselfStep({ ctx }: { ctx: UiCtx }) {
  const {
    treeName, setTreeName, self, setSelf, father, setFather, mother, setMother,
    setStep, error, handleFinish, hasFather, hasMother, canProceedTree, canProceedSelf,
  } = ctx;
  return (

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Start with yourself
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              You&apos;ll be the center of your tree. More details can be added later.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Your first name"
                value={self.firstName}
                onChange={(e) => setSelf({ ...self, firstName: e.target.value })}
                autoFocus
              />
              <Input
                label="Last Name"
                placeholder="Your last name"
                value={self.lastName}
                onChange={(e) => setSelf({ ...self, lastName: e.target.value })}
              />
            </div>

            <Input
              label="Birth Date (optional)"
              type="date"
              value={self.birthDate}
              onChange={(e) => setSelf({ ...self, birthDate: e.target.value })}
            />

            <div>
              <div className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300" id="onboarding-gender-label">
                Gender
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['male', 'female', 'other', 'unknown'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelf({ ...self, gender: g })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      self.gender === g
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setStep('parents')}
              disabled={!canProceedSelf}
            >
              Continue
            </Button>
          </div>
        </div>
      
  );
}
