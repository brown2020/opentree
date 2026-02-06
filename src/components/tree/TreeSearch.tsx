'use client';

import { useState, useRef, useEffect } from 'react';
import type { Person } from '@/lib/types';

interface TreeSearchProps {
  persons: Person[];
  onSelectPerson: (personId: string) => void;
}

export function TreeSearch({ persons, onSelectPerson }: TreeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? persons.filter((p) => {
        const q = query.toLowerCase();
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
        const maiden = p.maidenName?.toLowerCase() || '';
        return fullName.includes(q) || maiden.includes(q);
      })
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (personId: string) => {
    onSelectPerson(personId);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
          <div className="max-h-60 overflow-y-auto py-1">
            {results.map((person) => (
              <button
                key={person.id}
                onClick={() => handleSelect(person.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    person.gender === 'male'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : person.gender === 'female'
                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {person.firstName?.[0]}
                  {person.lastName?.[0]}
                </div>
                <span className="text-gray-900 dark:text-gray-100">
                  {person.firstName} {person.lastName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-600 dark:bg-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No results found
          </p>
        </div>
      )}
    </div>
  );
}
