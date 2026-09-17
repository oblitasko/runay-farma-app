import type { Session } from '@supabase/supabase-js';
import { AuthApiAdapter } from '../adapters';
import type { Profile } from '../domain/entities';

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export const AuthPort = {
  async signIn(email: string, password: string) {
    const { data, error } = await AuthApiAdapter.auth.signInWithPassword({ email, password });
    throwIfError(error);
    return data;
  },

  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await AuthApiAdapter.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
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
      .select('id, user_id, organization_id, store_id, role, full_name')
      .eq('user_id', userId)
      .single();
    throwIfError(error);
    if (!data) throw new Error('No se encontró el perfil');
    return data as Profile;
  },
};
