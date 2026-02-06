'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Person, RelationshipType } from '@/lib/types';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  allPersons: Person[];
  onAdd: (
    type: RelationshipType,
    person1Id: string,
    person2Id: string
  ) => Promise<void>;
  loading: boolean;
}

type RelationAction = 'add-parent' | 'add-child' | 'add-spouse';

export function AddRelationshipModal({
  isOpen,
  onClose,
  person,
  allPersons,
  onAdd,
  loading,
}: AddRelationshipModalProps) {
  const [action, setAction] = useState<RelationAction>('add-parent');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async () => {
    if (!selectedPersonId) return;

    let type: RelationshipType;
    let p1: string;
    let p2: string;

    switch (action) {
      case 'add-parent':
        // Selected person is parent of current person
        type = 'parent-child';
        p1 = selectedPersonId; // parent
        p2 = person.id; // child
        break;
      case 'add-child':
        // Current person is parent of selected person
        type = 'parent-child';
        p1 = person.id; // parent
        p2 = selectedPersonId; // child
        break;
      case 'add-spouse':
        type = 'spouse';
        p1 = person.id;
        p2 = selectedPersonId;
        break;
    }

    await onAdd(type, p1, p2);
    handleClose();
  };

  const handleClose = () => {
    setAction('add-parent');
    setSelectedPersonId('');
    setSearchQuery('');
    onClose();
  };

  // Filter out current person and filter by search
  const filteredPersons = allPersons.filter((p) => {
    if (p.id === person.id) return false;
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName.includes(query);
  });

  const actions: { value: RelationAction; label: string; description: string }[] = [
    {
      value: 'add-parent',
      label: 'Add Parent',
      description: `Select someone who is a parent of ${person.firstName}`,
    },
    {
      value: 'add-child',
      label: 'Add Child',
      description: `Select someone who is a child of ${person.firstName}`,
    },
    {
      value: 'add-spouse',
      label: 'Add Spouse',
      description: `Select someone who is a spouse of ${person.firstName}`,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Relationship for ${person.firstName}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Relationship type selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Relationship Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {actions.map((a) => (
              <button
                key={a.value}
                onClick={() => setAction(a.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  action === a.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {actions.find((a) => a.value === action)?.description}
          </p>
        </div>

        {/* Person selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Person
          </label>
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
            {filteredPersons.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No matching persons found
              </p>
            ) : (
              filteredPersons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonId(p.id)}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-gray-700 ${
                    selectedPersonId === p.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                      p.gender === 'male'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : p.gender === 'female'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {p.firstName?.[0]}
                    {p.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.firstName} {p.lastName}
                    </p>
                  </div>
                  {selectedPersonId === p.id && (
                    <svg
                      className="h-5 w-5 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedPersonId}
          >
            Add Relationship
          </Button>
        </div>
      </div>
    </Modal>
  );
}
