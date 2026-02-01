import { create } from 'zustand';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  emailVerified: boolean;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setEmailVerified: (verified: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  emailVerified: false,
  loading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setEmailVerified: (emailVerified) => set({ emailVerified }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized, loading: false }),
}));
