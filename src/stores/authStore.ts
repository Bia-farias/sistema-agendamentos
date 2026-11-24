import { create } from 'zustand';
import { Profile, Tenant } from '../types';
import { authApiService, translateAuthError } from '../services/api/authService';
import { getAuthToken, setAuthToken } from '../services/api/apiClient';
import { tenantApiService } from '../services/api/tenantService';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  isImpersonating: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  impersonateCompany: (companyId: string) => Promise<{ success: boolean; message?: string }>;
  exitImpersonation: () => void;
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
  isImpersonating: false,

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
        set({ user: null, profile: null, tenant: null, isImpersonating: false, loading: false });
        return;
      }

      const { user, profile, tenant } = await authApiService.getMe();
      const isImpersonating = Boolean(
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem('master_impersonator_backup')
      );

      set({
        user,
        profile,
        tenant,
        isImpersonating,
        loading: false,
      });
    } catch (err) {
      console.warn('Sessão expirada ou backend indisponível:', err);
      authApiService.signOut();
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('master_impersonator_backup');
      }
      set({ user: null, profile: null, tenant: null, isImpersonating: false, loading: false });
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
        isImpersonating: false,
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
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('master_impersonator_backup');
      }
      set({ user: null, profile: null, tenant: null, isImpersonating: false, loading: false });
    }
  },

  impersonateCompany: async (companyId: string) => {
    try {
      const currentToken = getAuthToken();
      const currentProfile = get().profile;
      const currentUser = get().user;
      const currentTenant = get().tenant;

      if (!currentToken || !currentProfile) {
        return { success: false, message: 'Sessão Master inválida' };
      }

      // Se ainda não estava impersonando, salva o backup master no sessionStorage
      if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('master_impersonator_backup')) {
        const backupData = {
          token: currentToken,
          profile: currentProfile,
          user: currentUser,
          tenant: currentTenant,
        };
        sessionStorage.setItem('master_impersonator_backup', JSON.stringify(backupData));
      }

      // Faz a requisição de impersonação para a empresa selecionada
      const data = await tenantApiService.impersonateCompany(companyId);

      // Define o token da sessão da empresa
      setAuthToken(data.token);

      set({
        user: data.user,
        profile: data.profile,
        tenant: data.tenant,
        isImpersonating: true,
        loading: false,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Falha ao impersonar empresa:', err);
      return {
        success: false,
        message: err?.message || 'Falha ao conectar como administrador da empresa.',
      };
    }
  },

  exitImpersonation: () => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const backupStr = sessionStorage.getItem('master_impersonator_backup');
        if (backupStr) {
          const backup = JSON.parse(backupStr);
          sessionStorage.removeItem('master_impersonator_backup');
          setAuthToken(backup.token);
          set({
            user: backup.user,
            profile: backup.profile,
            tenant: backup.tenant,
            isImpersonating: false,
            loading: false,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao restaurar sessão master:', err);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('master_impersonator_backup');
      }
      set({ isImpersonating: false });
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
