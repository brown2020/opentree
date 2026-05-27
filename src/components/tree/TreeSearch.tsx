'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import type { Person } from '@/lib/types';
import { timestampToDate } from '@/lib/firebase/firestore';

interface TreeSearchProps {
  persons: Person[];
  onSelectPerson: (personId: string) => void;
  getLifespanLabel?: (person: Person) => string;
}

function getLifeYears(
  person: Person,
  getLifespanLabel?: (person: Person) => string
): string {
  if (getLifespanLabel) {
    return getLifespanLabel(person);
  }
  const birth = timestampToDate(person.birthDate);
  const death = timestampToDate(person.deathDate);
  if (!birth) return person.isLiving ? 'Living' : '';
  const b = format(birth, 'yyyy');
  if (person.isLiving) return `b. ${b}`;
  if (death) return `${b}–${format(death, 'yyyy')}`;
  return `b. ${b}`;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-emerald-600 dark:text-emerald-400">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function TreeSearch({ persons, onSelectPerson, getLifespanLabel }: TreeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return persons.filter((p) => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const maiden = p.maidenName?.toLowerCase() || '';
      return fullName.includes(q) || maiden.includes(q);
    });
  }, [query, persons]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (personId: string) => {
      onSelectPerson(personId);
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelectPerson]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [isOpen, results, activeIndex, handleSelect]
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search people..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
          <div ref={listRef} id="search-listbox" role="listbox" className="max-h-60 overflow-y-auto py-1">
            {results.map((person, idx) => {
              const fullName = `${person.firstName} ${person.lastName}`;
              const years = getLifeYears(person, getLifespanLabel);
              return (
                <button
                  key={person.id}
                  id={`search-option-${idx}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                  onClick={() => handleSelect(person.id)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                    activeIndex === idx
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
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
                  <div className="min-w-0 flex-1">
                    <span className="text-gray-900 dark:text-gray-100">
                      {highlightMatch(fullName, query)}
                    </span>
                    {years && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        {years}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
