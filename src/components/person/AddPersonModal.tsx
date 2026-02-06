'use client';

import { Modal } from '@/components/ui/Modal';
import { PersonForm } from './PersonForm';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonSchemaFormData) => Promise<void>;
  loading?: boolean;
}

export function AddPersonModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
}: AddPersonModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Person to Tree" size="lg">
      <PersonForm onSubmit={onSubmit} onCancel={onClose} loading={loading} />
    </Modal>
  );
}
