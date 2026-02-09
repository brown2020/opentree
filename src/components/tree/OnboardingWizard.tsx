'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createTree, createPerson, updateTree, deleteTree } from '@/lib/firebase/firestore';
import { addRelationship } from '@/lib/firebase/relationships';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type WizardStep = 'tree' | 'yourself' | 'parents' | 'creating';

interface PersonInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

const EMPTY_PERSON: PersonInput = {
  firstName: '',
  lastName: '',
  birthDate: '',
  gender: 'unknown',
};

export function OnboardingWizard() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<WizardStep>('tree');
  const [treeName, setTreeName] = useState('');
  const [self, setSelf] = useState<PersonInput>({ ...EMPTY_PERSON });
  const [father, setFather] = useState<PersonInput>({ ...EMPTY_PERSON, gender: 'male' });
  const [mother, setMother] = useState<PersonInput>({ ...EMPTY_PERSON, gender: 'female' });
  const [error, setError] = useState<string | null>(null);

  const canProceedTree = treeName.trim().length > 0;
  const canProceedSelf = self.firstName.trim().length > 0 && self.lastName.trim().length > 0;
  const hasFather = father.firstName.trim().length > 0 && father.lastName.trim().length > 0;
  const hasMother = mother.firstName.trim().length > 0 && mother.lastName.trim().length > 0;

  const handleFinish = useCallback(async () => {
    if (!user) return;
    setStep('creating');
    setError(null);

    let treeId: string | null = null;

    try {
      // 1. Create the tree
      treeId = await createTree(user.uid, {
        name: treeName.trim(),
        description: '',
      });

      // 2. Create self as root person
      const selfId = await createPerson(treeId, {
        firstName: self.firstName.trim(),
        lastName: self.lastName.trim(),
        gender: self.gender,
        birthDate: self.birthDate ? new Date(self.birthDate + 'T00:00:00') : null,
        isLiving: true,
      });

      await updateTree(treeId, { rootPersonId: selfId });

      // 3. Create parents and link them
      let fatherId: string | null = null;
      let motherId: string | null = null;

      if (hasFather) {
        fatherId = await createPerson(treeId, {
          firstName: father.firstName.trim(),
          lastName: father.lastName.trim(),
          gender: 'male',
          birthDate: father.birthDate ? new Date(father.birthDate + 'T00:00:00') : null,
          isLiving: true,
        });
        await addRelationship(treeId, 'parent-child', fatherId, selfId);
      }

      if (hasMother) {
        motherId = await createPerson(treeId, {
          firstName: mother.firstName.trim(),
          lastName: mother.lastName.trim(),
          gender: 'female',
          birthDate: mother.birthDate ? new Date(mother.birthDate + 'T00:00:00') : null,
          isLiving: true,
        });
        await addRelationship(treeId, 'parent-child', motherId, selfId);
      }

      // 4. Link parents as spouses if both provided
      if (fatherId && motherId) {
        await addRelationship(treeId, 'spouse', fatherId, motherId);
      }

      router.push(`/tree/${treeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('parents');

      // Best-effort cleanup: delete the orphaned tree
      if (treeId) {
        try {
          await deleteTree(treeId, user.uid);
        } catch {
          // Cleanup failed — orphaned tree will remain
        }
      }
    }
  }, [user, treeName, self, father, mother, hasFather, hasMother, router]);

  const stepNumber = step === 'tree' ? 1 : step === 'yourself' ? 2 : 3;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress indicator */}
      {step !== 'creating' && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Step {stepNumber} of 3</span>
            {step !== 'tree' && (
              <button
                onClick={() => setStep(step === 'parents' ? 'yourself' : 'tree')}
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Back
              </button>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(stepNumber / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Creating state */}
      {step === 'creating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Creating your family tree...
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This will just take a moment.
          </p>
        </div>
      )}

      {/* Step 1: Tree name */}
      {step === 'tree' && (
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
      )}

      {/* Step 2: About yourself */}
      {step === 'yourself' && (
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
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
              </label>
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
      )}

      {/* Step 3: Parents (optional) */}
      {step === 'parents' && (
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
      )}
    </div>
  );
}
