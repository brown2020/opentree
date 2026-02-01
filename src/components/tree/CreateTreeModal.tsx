'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { treeSchema, type TreeSchemaFormData } from '@/lib/utils/validation';

interface CreateTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TreeSchemaFormData) => Promise<void>;
  loading?: boolean;
}

export function CreateTreeModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: CreateTreeModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TreeSchemaFormData>({
    resolver: zodResolver(treeSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (data: TreeSchemaFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Family Tree"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            loading={loading}
          >
            Create Tree
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Tree Name"
          placeholder="e.g., Smith Family Tree"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            placeholder="A brief description of this family tree..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            {...register('description')}
          />
          {errors.description?.message && (
            <p className="mt-1 text-sm text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
