import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { AuthPort } from '../../ports';
import type { Profile } from '../entities';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: LoadingStatusProps;
  error: string | null;
  onInit: () => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  clearError: () => void;
};

let authListenerAttached = false;

async function loadProfile(session: Session | null): Promise<Profile | null> {
  if (!session?.user.id) return null;
  return AuthPort.getProfile(session.user.id);
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  loading: { status: 'loading' },
  error: null,

  onInit: async () => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const session = await AuthPort.getSession();
      const profile = await loadProfile(session);
      set({ session, profile, loading: { status: 'success' } });
      if (!authListenerAttached) {
        authListenerAttached = true;
        AuthPort.onAuthStateChange(async (nextSession) => {
          try {
            const nextProfile = await loadProfile(nextSession);
            set({ session: nextSession, profile: nextProfile });
          } catch {
            set({ session: nextSession, profile: null });
          }
        });
      }
    } catch (error) {
      set({
        session: null,
        profile: null,
        error: error instanceof Error ? error.message : 'No se pudo iniciar la sesión',
        loading: { status: 'failed' },
      });
    }
  },

  onSignIn: async (email, password) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const { session } = await AuthPort.signIn(email.trim(), password);
      const profile = await loadProfile(session);
      set({ session, profile, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo iniciar sesión',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },

  onSignUp: async (email, password, fullName) => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const { session } = await AuthPort.signUp(email.trim(), password, fullName.trim());
      if (!session) {
        set({
          loading: { status: 'success' },
          error: 'Cuenta creada. Si el proyecto pide confirmación, revisa el correo y luego entra.',
        });
        return;
      }
      const profile = await loadProfile(session);
      set({ session, profile, loading: { status: 'success' } });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'No se pudo crear la cuenta',
        loading: { status: 'failed' },
      });
      throw error;
    }
  },

  onSignOut: async () => {
    await AuthPort.signOut();
    set({ session: null, profile: null, error: null, loading: { status: 'success' } });
    router.replace('/(auth)/login');
  },

  clearError: () => set({ error: null }),
}));
