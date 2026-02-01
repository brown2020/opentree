import { create } from 'zustand';
import type { Tree, Person } from '@/lib/types';

interface TreeState {
  currentTree: Tree | null;
  persons: Person[];
  selectedPersonId: string | null;
  setCurrentTree: (tree: Tree | null) => void;
  setPersons: (persons: Person[]) => void;
  setSelectedPersonId: (id: string | null) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  currentTree: null,
  persons: [],
  selectedPersonId: null,
  setCurrentTree: (tree) => set({ currentTree: tree }),
  setPersons: (persons) => set({ persons }),
  setSelectedPersonId: (id) => set({ selectedPersonId: id }),
  addPerson: (person) =>
    set((state) => ({ persons: [...state.persons, person] })),
  updatePerson: (id, updates) =>
    set((state) => ({
      persons: state.persons.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removePerson: (id) =>
    set((state) => ({
      persons: state.persons.filter((p) => p.id !== id),
      selectedPersonId:
        state.selectedPersonId === id ? null : state.selectedPersonId,
    })),
}));
