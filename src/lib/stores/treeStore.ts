import { create } from 'zustand';
import type { Tree, Person, Relationship } from '@/lib/types';

interface TreeState {
  currentTree: Tree | null;
  persons: Person[];
  relationships: Relationship[];
  selectedPersonId: string | null;
  rootPersonId: string | null;
  setCurrentTree: (tree: Tree | null) => void;
  setPersons: (persons: Person[]) => void;
  setRelationships: (relationships: Relationship[]) => void;
  setSelectedPersonId: (id: string | null) => void;
  setRootPersonId: (id: string | null) => void;
  addPerson: (person: Person) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
}

export const useTreeStore = create<TreeState>((set) => ({
  currentTree: null,
  persons: [],
  relationships: [],
  selectedPersonId: null,
  rootPersonId: null,
  setCurrentTree: (tree) => set({ currentTree: tree }),
  setPersons: (persons) => set({ persons }),
  setRelationships: (relationships) => set({ relationships }),
  setSelectedPersonId: (id) => set({ selectedPersonId: id }),
  setRootPersonId: (id) => set({ rootPersonId: id }),
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
