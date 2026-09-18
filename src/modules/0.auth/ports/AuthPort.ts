import type { Session } from '@supabase/supabase-js';
import { AuthApiAdapter } from '../adapters';
import type { CashierInput, Profile, Store, StoreInput } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

const profileColumns = 'id, user_id, organization_id, store_id, role, full_name, email, is_active';
const storeColumns =
  'id, organization_id, name, address, district, phone, hours, sanitary_auth, director_name, director_license';

async function functionErrorMessage(error: { message: string; context?: Response } | null, data: unknown) {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  if (!error) return null;
  try {
    if (error.context) {
      const body = (await error.context.clone().json()) as { error?: string };
      if (body?.error) return body.error;
    }
  } catch {
    // El mensaje genérico basta.
  }
  return error.message;
}

export const AuthPort = {
  async signIn(email: string, password: string) {
    const { data, error } = await AuthApiAdapter.auth.signInWithPassword({ email, password });
    throwIfError(error);
    return data;
  },

  async signOut() {
    const { error } = await AuthApiAdapter.auth.signOut();
    throwIfError(error);
  },

  async getSession() {
    const { data, error } = await AuthApiAdapter.auth.getSession();
    throwIfError(error);
    return data.session;
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    return AuthApiAdapter.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },

  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await AuthApiAdapter.from('profiles')
      .select(profileColumns)
      .eq('user_id', userId)
      .single();
    throwIfError(error);
    if (!data) throw new Error('No se encontró el perfil');
    return data as Profile;
  },

  async listStores(organizationId: string): Promise<Store[]> {
    const { data, error } = await AuthApiAdapter.from('stores')
      .select(storeColumns)
      .eq('organization_id', organizationId)
      .order('name');
    throwIfError(error);
    return (data ?? []) as Store[];
  },

  async createStore(organizationId: string, name: string): Promise<Store> {
    const { data, error } = await AuthApiAdapter.from('stores')
      .insert({ organization_id: organizationId, name: name.trim() })
      .select(storeColumns)
      .single();
    throwIfError(error);
    return data as Store;
  },

  async updateStore(storeId: string, input: StoreInput): Promise<Store> {
    const { data, error } = await AuthApiAdapter.from('stores')
      .update({
        name: input.name.trim(),
        address: input.address?.trim() || null,
        district: input.district?.trim() || null,
        phone: input.phone?.trim() || null,
        hours: input.hours?.trim() || null,
        sanitary_auth: input.sanitary_auth?.trim() || null,
        director_name: input.director_name?.trim() || null,
        director_license: input.director_license?.trim() || null,
      })
      .eq('id', storeId)
      .select(storeColumns)
      .single();
    throwIfError(error);
    return data as Store;
  },

  async listStaff(organizationId: string): Promise<Profile[]> {
    const { data, error } = await AuthApiAdapter.from('profiles')
      .select(profileColumns)
      .eq('organization_id', organizationId)
      .eq('role', 'cashier')
      .order('full_name');
    throwIfError(error);
    return (data ?? []) as Profile[];
  },

  async createCashier(input: CashierInput): Promise<Profile> {
    const { data, error } = await AuthApiAdapter.functions.invoke('create-cashier', {
      body: {
        full_name: input.full_name.trim(),
        email: input.email.trim(),
        password: input.password,
        store_id: input.store_id,
      },
    });
    const message = await functionErrorMessage(error, data);
    if (message) throw new Error(message);
    const profile = (data as { profile?: Profile } | null)?.profile;
    if (!profile) throw new Error('No se pudo crear el cajero');
    return profile;
  },

  async assignStaffStore(profileId: string, storeId: string): Promise<Profile> {
    const { data, error } = await AuthApiAdapter.from('profiles')
      .update({ store_id: storeId })
      .eq('id', profileId)
      .eq('role', 'cashier')
      .select(profileColumns)
      .single();
    throwIfError(error);
    return data as Profile;
  },

  async setStaffActive(profileId: string, isActive: boolean): Promise<Profile> {
    const { data, error } = await AuthApiAdapter.from('profiles')
      .update({ is_active: isActive })
      .eq('id', profileId)
      .eq('role', 'cashier')
      .select(profileColumns)
      .single();
    throwIfError(error);
    return data as Profile;
  },
};
