import { create } from 'zustand';
import { Profile, Tenant, UserRole } from '../types';
import { authApiService, translateAuthError } from '../services/api/authService';
import { getAuthToken } from '../services/api/apiClient';
import { initialTenant, initialProfiles } from '../services/mockData';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role?: UserRole) => void;
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
        // Verificar se há sessão demo salva no localStorage
        const savedUser = localStorage.getItem('agenda_ai_demo_user');
        const savedProfile = localStorage.getItem('agenda_ai_demo_profile');
        const savedTenant = localStorage.getItem('agenda_ai_demo_tenant');

        if (savedUser && savedProfile) {
          set({
            user: JSON.parse(savedUser),
            profile: JSON.parse(savedProfile),
            tenant: savedTenant ? JSON.parse(savedTenant) : initialTenant,
            loading: false,
          });
          return;
        }

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
      console.warn('Sessão expirada ou backend indisponível, verificando demo local:', err);
      const savedUser = localStorage.getItem('agenda_ai_demo_user');
      const savedProfile = localStorage.getItem('agenda_ai_demo_profile');
      const savedTenant = localStorage.getItem('agenda_ai_demo_tenant');

      if (savedUser && savedProfile) {
        set({
          user: JSON.parse(savedUser),
          profile: JSON.parse(savedProfile),
          tenant: savedTenant ? JSON.parse(savedTenant) : initialTenant,
          loading: false,
        });
      } else {
        authApiService.signOut();
        set({ user: null, profile: null, tenant: null, loading: false });
      }
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
      // 1. Tentar login real no backend Express + Supabase
      const { user, profile, tenant } = await authApiService.signIn(email, password);
      // Limpar resquícios demo se existirem
      localStorage.removeItem('agenda_ai_demo_user');
      localStorage.removeItem('agenda_ai_demo_profile');
      localStorage.removeItem('agenda_ai_demo_tenant');

      set({
        user,
        profile,
        tenant,
        loading: false,
      });

      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || '';
      const isConnectionError =
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('não foi possível conectar') ||
        errMsg.includes('Load failed');

      // 2. Fallback gracioso: Se o backend estiver desligado, permite login demo com as credenciais padrão
      if (isConnectionError && password === '123456') {
        const matched =
          initialProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || {
            ...initialProfiles[0],
            email,
            full_name: email.split('@')[0],
          };

        const userObj = { id: matched.user_id, email: matched.email };
        localStorage.setItem('agenda_ai_demo_user', JSON.stringify(userObj));
        localStorage.setItem('agenda_ai_demo_profile', JSON.stringify(matched));
        localStorage.setItem('agenda_ai_demo_tenant', JSON.stringify(initialTenant));

        set({
          user: userObj,
          profile: matched,
          tenant: initialTenant,
          loading: false,
        });

        return { success: true };
      }

      return {
        success: false,
        message: translateAuthError(err?.message || ''),
      };
    }
  },

  quickLogin: (role: UserRole = 'owner') => {
    const matched = initialProfiles.find((p) => p.role === role) || initialProfiles[0];
    const userObj = { id: matched.user_id, email: matched.email };

    localStorage.setItem('agenda_ai_demo_user', JSON.stringify(userObj));
    localStorage.setItem('agenda_ai_demo_profile', JSON.stringify(matched));
    localStorage.setItem('agenda_ai_demo_tenant', JSON.stringify(initialTenant));

    set({
      user: userObj,
      profile: matched,
      tenant: initialTenant,
      loading: false,
    });
  },

  logout: async () => {
    try {
      await authApiService.signOut();
    } catch (err) {
      console.warn('Erro ao realizar logout no backend:', err);
    } finally {
      localStorage.removeItem('agenda_ai_demo_user');
      localStorage.removeItem('agenda_ai_demo_profile');
      localStorage.removeItem('agenda_ai_demo_tenant');
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
