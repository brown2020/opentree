'use client';

import { OnboardingCreatingStep } from '@/components/tree/onboarding/OnboardingCreatingStep';
import { OnboardingTreeStep } from '@/components/tree/onboarding/OnboardingTreeStep';
import { OnboardingYourselfStep } from '@/components/tree/onboarding/OnboardingYourselfStep';
import { OnboardingParentsStep } from '@/components/tree/onboarding/OnboardingParentsStep';

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

  const stepCtx = {
    treeName, setTreeName, self, setSelf, father, setFather, mother, setMother,
    setStep, error, handleFinish, hasFather, hasMother, canProceedTree, canProceedSelf,
  };

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
              className="h-full rounded-full bg-emerald-500 transition-colors duration-500"
              style={{ width: `${(stepNumber / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Creating state */}
            {step === 'creating' && <OnboardingCreatingStep ctx={stepCtx} />}

      {/* Step 1: Tree name */}
            {step === 'tree' && <OnboardingTreeStep ctx={stepCtx} />}

      {/* Step 2: About yourself */}
            {step === 'yourself' && <OnboardingYourselfStep ctx={stepCtx} />}

      {/* Step 3: Parents (optional) */}
            {step === 'parents' && <OnboardingParentsStep ctx={stepCtx} />}
    </div>
  );
}
