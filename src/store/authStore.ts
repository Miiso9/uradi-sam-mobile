import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const initialState: AuthState = {
  session: null,
  user: null,
  isInitialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setSession: (session) => set({ session, user: session?.user || null, isInitialized: true }),

  initializeAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, user: session?.user || null, isInitialized: true });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ ...initialState, isInitialized: true });
  },
}));

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthIsInitialized = () => useAuthStore((state) => state.isInitialized);
export const useAuthActions = () =>
  useAuthStore((state) => ({
    signOut: state.signOut,
    setSession: state.setSession,
    initializeAuth: state.initializeAuth,
  }));
