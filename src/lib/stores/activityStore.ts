import { create } from 'zustand';

interface ActivityStore {
  bump: number;
  notifyActivityChanged: () => void;
}

export const useActivityStore = create<ActivityStore>((set) => ({
  bump: 0,
  notifyActivityChanged: () => set((state) => ({ bump: state.bump + 1 })),
}));
