import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { create } from 'zustand';
import type { LoadingStatusProps } from '@/src/modules/_shared/domain/entities';
import { AuthPort } from '../../ports';
import type { Profile, Store } from '../entities';

const ACTIVE_STORE_KEY = 'runay.farma.activeStoreId';

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  stores: Store[];
  staff: Profile[];
  activeStoreId: string | null;
  loading: LoadingStatusProps;
  error: string | null;
  onInit: () => Promise<void>;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, fullName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSetActiveStore: (storeId: string) => Promise<void>;
  onLoadStores: () => Promise<void>;
  onCreateStore: (name: string) => Promise<Store>;
  onLoadStaff: () => Promise<void>;
  onAssignStaffStore: (profileId: string, storeId: string) => Promise<void>;
  clearError: () => void;
};

let authListenerAttached = false;

async function loadProfile(session: Session | null): Promise<Profile | null> {
  if (!session?.user.id) return null;
  return AuthPort.getProfile(session.user.id);
}

async function resolveActiveStore(profile: Profile | null): Promise<{ stores: Store[]; activeStoreId: string | null }> {
  if (!profile) return { stores: [], activeStoreId: null };
  const stores = await AuthPort.listStores(profile.organization_id);
  if (profile.role !== 'owner') {
    return { stores, activeStoreId: profile.store_id };
  }
  const saved = await AsyncStorage.getItem(ACTIVE_STORE_KEY);
  const validSaved = saved && stores.some((store) => store.id === saved) ? saved : null;
  return {
    stores,
    activeStoreId: validSaved ?? profile.store_id ?? stores[0]?.id ?? null,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  stores: [],
  staff: [],
  activeStoreId: null,
  loading: { status: 'loading' },
  error: null,

  onInit: async () => {
    set({ loading: { status: 'loading' }, error: null });
    try {
      const session = await AuthPort.getSession();
      const profile = await loadProfile(session);
      const { stores, activeStoreId } = await resolveActiveStore(profile);
      set({ session, profile, stores, activeStoreId, loading: { status: 'success' } });
      if (!authListenerAttached) {
        authListenerAttached = true;
        AuthPort.onAuthStateChange(async (nextSession) => {
          try {
            const nextProfile = await loadProfile(nextSession);
            const next = await resolveActiveStore(nextProfile);
            set({ session: nextSession, profile: nextProfile, stores: next.stores, activeStoreId: next.activeStoreId });
          } catch {
            set({ session: nextSession, profile: null, stores: [], activeStoreId: null });
          }
        });
      }
    } catch (error) {
      set({
        session: null,
        profile: null,
        stores: [],
        activeStoreId: null,
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
      const { stores, activeStoreId } = await resolveActiveStore(profile);
      set({ session, profile, stores, activeStoreId, loading: { status: 'success' } });
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
      const { stores, activeStoreId } = await resolveActiveStore(profile);
      set({ session, profile, stores, activeStoreId, loading: { status: 'success' } });
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
    set({
      session: null,
      profile: null,
      stores: [],
      staff: [],
      activeStoreId: null,
      error: null,
      loading: { status: 'success' },
    });
    router.replace('/(auth)/login');
  },

  onSetActiveStore: async (storeId) => {
    const { profile, stores } = get();
    if (profile?.role !== 'owner') return;
    if (!stores.some((store) => store.id === storeId)) return;
    await AsyncStorage.setItem(ACTIVE_STORE_KEY, storeId);
    set({ activeStoreId: storeId });
  },

  onLoadStores: async () => {
    const { profile } = get();
    if (!profile) return;
    const stores = await AuthPort.listStores(profile.organization_id);
    const current = get().activeStoreId;
    const activeStoreId =
      current && stores.some((store) => store.id === current) ? current : (profile.store_id ?? stores[0]?.id ?? null);
    set({ stores, activeStoreId });
  },

  onCreateStore: async (name) => {
    const { profile } = get();
    if (!profile || profile.role !== 'owner') throw new Error('Solo el dueño puede crear sucursales');
    const store = await AuthPort.createStore(profile.organization_id, name);
    set({ stores: [...get().stores, store].sort((a, b) => a.name.localeCompare(b.name, 'es')) });
    return store;
  },

  onLoadStaff: async () => {
    const { profile } = get();
    if (!profile) return;
    const staff = await AuthPort.listStaff(profile.organization_id);
    set({ staff });
  },

  onAssignStaffStore: async (profileId, storeId) => {
    const staffMember = await AuthPort.assignStaffStore(profileId, storeId);
    set({ staff: get().staff.map((item) => (item.id === profileId ? staffMember : item)) });
  },

  clearError: () => set({ error: null }),
}));
