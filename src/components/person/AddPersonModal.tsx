'use client';

import { Modal } from '@/components/ui/Modal';
import { PersonForm } from './PersonForm';
import type { Person } from '@/lib/types';
import type { PersonSchemaFormData } from '@/lib/utils/validation';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonSchemaFormData) => Promise<void>;
  loading?: boolean;
  treeId: string;
  existingPersons?: Person[];
}

export function AddPersonModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  treeId,
  existingPersons = [],
}: AddPersonModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Person to Tree" size="lg">
      <PersonForm
        onSubmit={onSubmit}
        onCancel={onClose}
        loading={loading}
        treeId={treeId}
        existingPersons={existingPersons}
      />
    </Modal>
  );
}
