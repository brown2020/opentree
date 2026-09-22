'use client';

import { Controller, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { toLocalDateString } from '@/lib/utils/dateFormat';
import type { PersonSchemaFormData } from '@/lib/utils/validation';
import type { Person } from '@/lib/types';

interface Props {
  person?: Person;
  isLiving: boolean;
  loading?: boolean;
  errors: FieldErrors<PersonSchemaFormData>;
  register: UseFormRegister<PersonSchemaFormData>;
  control: Control<PersonSchemaFormData>;
  onCancel: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function PersonFormFields({
  person, isLiving, loading, errors, register, control, onCancel, onSubmit,
}: Props) {
  return (
<form onSubmit={onSubmit} className="space-y-6">
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

      <Select label="Gender" {...register('gender')}>
        <option value="unknown">Unknown</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </Select>

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
              <label htmlFor="PersonForm-field-1" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                Birth Date
              </label>
              <input id="PersonForm-field-1"
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
                <label htmlFor="PersonForm-field-2" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Death Date
                </label>
                <input id="PersonForm-field-2"
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
        <label htmlFor="PersonForm-field-3" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Biography
        </label>
        <textarea id="PersonForm-field-3"
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
