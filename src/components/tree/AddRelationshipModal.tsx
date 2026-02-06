'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Person, Relationship, RelationshipType } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';
import { buildAdjacencyMap } from '@/lib/firebase/relationships';

interface AddRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  allPersons: Person[];
  existingRelationships?: Relationship[];
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
  existingRelationships = [],
  onAdd,
  loading,
}: AddRelationshipModalProps) {
  const [action, setAction] = useState<RelationAction>('add-parent');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Build adjacency map for validation
  const adj = useMemo(
    () =>
      buildAdjacencyMap(
        allPersons.map((p) => p.id),
        existingRelationships
      ),
    [allPersons, existingRelationships]
  );

  // Validate selected relationship for warnings
  const validationWarning = useMemo((): string | null => {
    if (!selectedPersonId) return null;

    const selected = allPersons.find((p) => p.id === selectedPersonId);
    if (!selected) return null;

    const entry = adj.get(person.id);

    // Check for duplicate relationships
    if (action === 'add-parent' && entry?.parents.includes(selectedPersonId)) {
      return `${selected.firstName} is already a parent of ${person.firstName}.`;
    }
    if (action === 'add-child' && entry?.children.includes(selectedPersonId)) {
      return `${selected.firstName} is already a child of ${person.firstName}.`;
    }
    if (action === 'add-spouse' && entry?.spouses.includes(selectedPersonId)) {
      return `${selected.firstName} is already a spouse of ${person.firstName}.`;
    }

    // Check max 2 parents
    if (action === 'add-parent' && entry && entry.parents.length >= 2) {
      return `${person.firstName} already has 2 parents. Adding more may create unexpected results.`;
    }

    // Check birth date logic: parent should be older than child
    if (action === 'add-parent') {
      const parentBirth = timestampToDate(selected.birthDate);
      const childBirth = timestampToDate(person.birthDate);
      if (parentBirth && childBirth && parentBirth >= childBirth) {
        return `Warning: ${selected.firstName} (born ${parentBirth.getFullYear()}) is not older than ${person.firstName} (born ${childBirth.getFullYear()}).`;
      }
    }
    if (action === 'add-child') {
      const parentBirth = timestampToDate(person.birthDate);
      const childBirth = timestampToDate(selected.birthDate);
      if (parentBirth && childBirth && parentBirth >= childBirth) {
        return `Warning: ${person.firstName} (born ${parentBirth.getFullYear()}) is not older than ${selected.firstName} (born ${childBirth.getFullYear()}).`;
      }
    }

    // Check self-ancestor loop: make sure adding this parent doesn't create a cycle
    if (action === 'add-parent') {
      if (isAncestor(selectedPersonId, person.id, adj)) {
        return `Cannot add: ${selected.firstName} is already a descendant of ${person.firstName}. This would create a loop.`;
      }
    }
    if (action === 'add-child') {
      if (isAncestor(person.id, selectedPersonId, adj)) {
        return `Cannot add: ${person.firstName} is already a descendant of ${selected.firstName}. This would create a loop.`;
      }
    }

    return null;
  }, [selectedPersonId, action, person, allPersons, adj]);

  const isBlockingWarning =
    validationWarning?.startsWith('Cannot add') ||
    validationWarning?.includes('already a parent') ||
    validationWarning?.includes('already a child') ||
    validationWarning?.includes('already a spouse');

  const handleSubmit = async () => {
    if (!selectedPersonId || isBlockingWarning) return;

    let type: RelationshipType;
    let p1: string;
    let p2: string;

    switch (action) {
      case 'add-parent':
        type = 'parent-child';
        p1 = selectedPersonId;
        p2 = person.id;
        break;
      case 'add-child':
        type = 'parent-child';
        p1 = person.id;
        p2 = selectedPersonId;
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
                onClick={() => {
                  setAction(a.value);
                  setSelectedPersonId('');
                }}
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

        {/* Validation warning */}
        {validationWarning && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              isBlockingWarning
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
            }`}
          >
            <div className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {validationWarning}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedPersonId || !!isBlockingWarning}
          >
            Add Relationship
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Check if `personId` is an ancestor of `targetId` (would create a cycle).
 */
function isAncestor(
  personId: string,
  targetId: string,
  adj: ReturnType<typeof buildAdjacencyMap>
): boolean {
  const visited = new Set<string>();
  const queue = [targetId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const entry = adj.get(current);
    if (!entry) continue;

    for (const parentId of entry.parents) {
      if (parentId === personId) return true;
      if (!visited.has(parentId)) queue.push(parentId);
    }
  }

  return false;
}
