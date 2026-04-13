'use client';

import { useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Person, Relationship } from '@/lib/types';
import { calculateRelationship } from '@/lib/utils/relationshipCalculator';

interface RelationshipCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  relationships: Relationship[];
}

export function RelationshipCalculatorModal({
  isOpen,
  onClose,
  persons,
  relationships,
}: RelationshipCalculatorModalProps) {
  const [person1Id, setPerson1Id] = useState<string>('');
  const [person2Id, setPerson2Id] = useState<string>('');
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const result = useMemo(() => {
    if (!person1Id || !person2Id) return null;
    return calculateRelationship(person1Id, person2Id, persons, relationships);
  }, [person1Id, person2Id, persons, relationships]);

  const person1 = persons.find((p) => p.id === person1Id);
  const person2 = persons.find((p) => p.id === person2Id);

  const filterPersons = (searchTerm: string) =>
    searchTerm.trim()
      ? persons.filter((p) => {
          const q = searchTerm.toLowerCase();
          return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
        })
      : persons;

  const handleClose = () => {
    setPerson1Id('');
    setPerson2Id('');
    setSearch1('');
    setSearch2('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Relationship Calculator"
      size="lg"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select two people to calculate how they are related.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Person 1 */}
          <PersonSelector
            label="Person 1"
            selectedId={person1Id}
            onSelect={(id) => setPerson1Id(id)}
            search={search1}
            onSearchChange={setSearch1}
            persons={filterPersons(search1)}
            selectedPerson={person1}
          />

          {/* Person 2 */}
          <PersonSelector
            label="Person 2"
            selectedId={person2Id}
            onSelect={(id) => setPerson2Id(id)}
            search={search2}
            onSearchChange={setSearch2}
            persons={filterPersons(search2)}
            selectedPerson={person2}
          />
        </div>

        {/* Result */}
        {result && result !== 'Not related' && (
          <div className="rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {person1?.firstName} is the
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {result}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              of {person2?.firstName}
            </p>
          </div>
        )}

        {person1Id && person2Id && (!result || result === 'Not related') && (
          <div className="rounded-xl bg-gray-50 p-6 text-center dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No relationship found between {person1?.firstName} and {person2?.firstName}.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PersonSelector({
  label,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  persons,
  selectedPerson,
}: {
  label: string;
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  persons: Person[];
  selectedPerson?: Person;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {selectedPerson ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-700 dark:bg-emerald-900/20">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {selectedPerson.firstName} {selectedPerson.lastName}
          </span>
          <button
            onClick={() => {
              onSelect('');
              onSearchChange('');
            }}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
            {persons.slice(0, 20).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  selectedId === p.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                }`}
              >
                <span className="text-gray-900 dark:text-gray-100">
                  {p.firstName} {p.lastName}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
