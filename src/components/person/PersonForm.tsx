'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { personSchema, type PersonSchemaFormData } from '@/lib/utils/validation';
import type { Person } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';
import { toLocalDateString } from '@/lib/utils/dateFormat';

interface PersonFormProps {
  person?: Person;
  onSubmit: (data: PersonSchemaFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function PersonForm({
  person,
  onSubmit,
  onCancel,
  loading,
}: PersonFormProps) {
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
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First Name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label="Last Name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Middle Name"
          error={errors.middleName?.message}
          {...register('middleName')}
        />
        <Input
          label="Maiden Name"
          error={errors.maidenName?.message}
          {...register('maidenName')}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Gender
        </label>
        <select
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          {...register('gender')}
        >
          <option value="unknown">Unknown</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Controller
          name="isLiving"
          control={control}
          render={({ field }) => (
            <input
              type="checkbox"
              id="isLiving"
              checked={field.value}
              onChange={field.onChange}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
          )}
        />
        <label
          htmlFor="isLiving"
          className="text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Currently living
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="birthDate"
          control={control}
          render={({ field }) => (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Birth Date
              </label>
              <input
                type="date"
                value={field.value ? toLocalDateString(field.value) : ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? new Date(e.target.value + 'T00:00:00') : null
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          )}
        />
        <Input
          label="Birth Place"
          error={errors.birthPlace?.message}
          {...register('birthPlace')}
        />
      </div>

      {!isLiving && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="deathDate"
            control={control}
            render={({ field }) => (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Death Date
                </label>
                <input
                  type="date"
                  value={field.value ? toLocalDateString(field.value) : ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? new Date(e.target.value + 'T00:00:00') : null
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
          />
          <Input
            label="Death Place"
            error={errors.deathPlace?.message}
            {...register('deathPlace')}
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Biography
        </label>
        <textarea
          rows={4}
          placeholder="Write a brief biography..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          {...register('bio')}
        />
        {errors.bio?.message && (
          <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {person ? 'Save Changes' : 'Add Person'}
        </Button>
      </div>
    </form>
  );
}
