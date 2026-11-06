import { create } from 'zustand';
import { Profile, Tenant } from '../types';
import { authApiService, translateAuthError } from '../services/api/authService';
import { getAuthToken } from '../services/api/apiClient';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
  updateTenant: (data: Partial<Tenant>) => void;
  updateProfile: (data: Partial<Profile>) => void;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  tenant: null,
  loading: true,

  isSuperAdmin: () => {
    const role = get().profile?.role;
    return role === 'super_admin' || role === 'owner';
  },

  isAdmin: () => {
    const role = get().profile?.role;
    return role === 'super_admin' || role === 'owner' || role === 'admin';
  },

  initialize: async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        set({ user: null, profile: null, tenant: null, loading: false });
        return;
      }

      const { user, profile, tenant } = await authApiService.getMe();
      set({
        user,
        profile,
        tenant,
        loading: false,
      });
    } catch (err) {
      console.warn('Sessão expirada ou backend indisponível:', err);
      authApiService.signOut();
      set({ user: null, profile: null, tenant: null, loading: false });
    }
  },

  login: async (email: string, password = '') => {
    if (!email || !password) {
      return {
        success: false,
        message: 'Por favor, informe seu e-mail e senha.',
      };
    }

    try {
      // Autenticação real no backend Express + Supabase (Bcrypt + JWT)
      const { user, profile, tenant } = await authApiService.signIn(email, password);

      set({
        user,
        profile,
        tenant,
        loading: false,
      });

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: translateAuthError(err?.message || ''),
      };
    }
  },

  logout: async () => {
    try {
      await authApiService.signOut();
    } catch (err) {
      console.warn('Erro ao realizar logout no backend:', err);
    } finally {
      set({ user: null, profile: null, tenant: null, loading: false });
    }
  },

  setTenant: (tenant: Tenant) => {
    set({ tenant });
  },

  updateTenant: (data: Partial<Tenant>) => {
    const current = get().tenant;
    if (!current) return;
    set({ tenant: { ...current, ...data } });
  },

  updateProfile: (data: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    set({ profile: { ...current, ...data } });
  },
}));
