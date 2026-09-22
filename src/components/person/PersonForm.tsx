'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DuplicatePersonWarning } from '@/components/person/DuplicatePersonWarning';
import { PersonFormFields } from '@/components/person/PersonFormFields';
import { personSchema, type PersonSchemaFormData } from '@/lib/utils/validation';
import { findSimilarPersons } from '@/lib/utils/duplicatePerson';
import type { Person } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';

interface PersonFormProps {
  person?: Person;
  existingPersons?: Person[];
  treeId?: string;
  onSubmit: (data: PersonSchemaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function PersonForm({
  person,
  existingPersons = [],
  treeId,
  onSubmit,
  onCancel,
  loading,
}: PersonFormProps) {
  const [duplicateMatches, setDuplicateMatches] = useState<
    ReturnType<typeof findSimilarPersons> | null
  >(null);
  const pendingDataRef = useRef<PersonSchemaFormData | null>(null);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<PersonSchemaFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      firstName: person?.firstName || '',
      lastName: person?.lastName || '',
      middleName: person?.middleName || '',
      maidenName: person?.maidenName || '',
      gender: person?.gender || 'unknown',
      birthDate: person?.birthDate ? timestampToDate(person.birthDate) : null,
      birthPlace: person?.birthPlace || '',
      deathDate: person?.deathDate ? timestampToDate(person.deathDate) : null,
      deathPlace: person?.deathPlace || '',
      isLiving: person?.isLiving ?? true,
      bio: person?.bio || '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- watch() is inherently mutable; React Compiler correctly skips this component
  const isLiving = watch('isLiving');

  const handleFormSubmit = async (data: PersonSchemaFormData) => {
    const payload = data.isLiving
      ? { ...data, deathDate: null, deathPlace: '' }
      : data;

    if (existingPersons.length > 0 && treeId) {
      const similar = findSimilarPersons(
        payload.firstName,
        payload.lastName,
        payload.birthDate ?? null,
        existingPersons,
        person?.id
      );
      if (similar.length > 0) {
        pendingDataRef.current = payload;
        setDuplicateMatches(similar);
        return;
      }
    }

    await onSubmit(payload);
  };

  const handleContinueDespiteDuplicates = async () => {
    if (!pendingDataRef.current) return;
    await onSubmit(pendingDataRef.current);
    pendingDataRef.current = null;
    setDuplicateMatches(null);
  };

  const handleCancelDuplicateWarning = () => {
    pendingDataRef.current = null;
    setDuplicateMatches(null);
  };

  if (duplicateMatches && duplicateMatches.length > 0 && treeId) {
    return (
      <DuplicatePersonWarning
        matches={duplicateMatches}
        treeId={treeId}
        onContinue={handleContinueDespiteDuplicates}
        onCancel={handleCancelDuplicateWarning}
        loading={loading}
      />
    );
  }

  return (
    <PersonFormFields
      person={person}
      isLiving={isLiving}
      loading={loading}
      errors={errors}
      register={register}
      control={control}
      onCancel={onCancel}
      onSubmit={handleSubmit(handleFormSubmit)}
    />
  );
}
