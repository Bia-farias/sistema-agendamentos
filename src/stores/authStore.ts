import { create } from 'zustand';
import { Profile, Tenant, UserRole } from '../types';
import { initialTenant, initialProfiles } from '../services/mockData';
import { isSupabaseConfigured } from '../services/supabase';
import { authApiService } from '../services/api/authService';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
  updateTenant: (data: Partial<Tenant>) => void;
  updateProfile: (data: Partial<Profile>) => void;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: { id: 'user-super-1', email: 'admin@agendaai.com' },
  profile: initialProfiles[0],
  tenant: initialTenant,
  loading: false,

  isSuperAdmin: () => {
    const role = get().profile?.role;
    return role === 'super_admin' || role === 'owner';
  },

  isAdmin: () => {
    const role = get().profile?.role;
    return role === 'super_admin' || role === 'owner' || role === 'admin';
  },

  initialize: async () => {
    const savedUser = localStorage.getItem('agenda_ai_user');
    const savedProfile = localStorage.getItem('agenda_ai_profile');
    const savedTenant = localStorage.getItem('agenda_ai_tenant');

    if (savedUser && savedProfile) {
      set({
        user: JSON.parse(savedUser),
        profile: JSON.parse(savedProfile),
        tenant: savedTenant ? JSON.parse(savedTenant) : initialTenant,
        loading: false,
      });
    } else {
      // Default to logged in as owner for immediate smooth trial
      set({
        user: { id: 'user-owner-1', email: 'admin@agendaai.com' },
        profile: initialProfiles[0],
        tenant: initialTenant,
        loading: false,
      });
    }
  },

  login: async (email: string, password = '', role: UserRole = 'owner') => {
    // 1. Tenta autenticação real com o Supabase caso configurado
    if (isSupabaseConfigured() && password) {
      try {
        const { user, profile, tenant } = await authApiService.signIn(email, password);
        const userObj = { id: user.id, email: user.email };
        localStorage.setItem('agenda_ai_user', JSON.stringify(userObj));
        if (profile) localStorage.setItem('agenda_ai_profile', JSON.stringify(profile));
        if (tenant) localStorage.setItem('agenda_ai_tenant', JSON.stringify(tenant));

        set({
          user: userObj,
          profile: profile || initialProfiles[0],
          tenant: tenant || initialTenant,
        });
        return { success: true };
      } catch (err: any) {
        console.warn('Falha no Supabase signIn:', err);
        return {
          success: false,
          message: err?.message || 'E-mail ou senha incorretos no Supabase.',
        };
      }
    }

    // 2. Validação do Modo Demonstração / Local
    if (!password || password.length < 4) {
      return {
        success: false,
        message: 'A senha informada deve possuir no mínimo 4 caracteres.',
      };
    }

    const isDemoEmail =
      email.toLowerCase() === 'admin@agendaai.com' ||
      email.toLowerCase().includes('demo') ||
      email.toLowerCase().includes('admin');

    if (isDemoEmail || password === '123456') {
      const matchedProfile =
        initialProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || {
          ...initialProfiles[0],
          email,
          full_name: email.split('@')[0].toUpperCase(),
          role,
        };

      const userObj = { id: matchedProfile.user_id, email: matchedProfile.email };

      localStorage.setItem('agenda_ai_user', JSON.stringify(userObj));
      localStorage.setItem('agenda_ai_profile', JSON.stringify(matchedProfile));
      localStorage.setItem('agenda_ai_tenant', JSON.stringify(initialTenant));

      set({
        user: userObj,
        profile: matchedProfile,
        tenant: initialTenant,
      });
      return { success: true };
    }

    return {
      success: false,
      message: 'Credenciais inválidas. Para testar localmente, utilize admin@agendaai.com (senha: 123456) ou clique nos botões de Acesso Rápido abaixo.',
    };
  },

  quickLogin: (role: UserRole) => {
    const roleTitles: Record<UserRole, string> = {
      super_admin: 'Super Administrador',
      owner: 'Super Administrador',
      admin: 'Administrador',
      professional: 'Profissional',
      receptionist: 'Recepcionista',
    };

    const newProfile: Profile = {
      id: `prof-${role}`,
      user_id: `user-${role}`,
      tenant_id: initialTenant.id,
      full_name: roleTitles[role] || 'Usuário',
      role,
      email: `${role}@agendaai.com`,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const userObj = { id: newProfile.user_id, email: newProfile.email };

    localStorage.setItem('agenda_ai_user', JSON.stringify(userObj));
    localStorage.setItem('agenda_ai_profile', JSON.stringify(newProfile));
    localStorage.setItem('agenda_ai_tenant', JSON.stringify(initialTenant));

    set({
      user: userObj,
      profile: newProfile,
      tenant: initialTenant,
    });
  },

  logout: () => {
    localStorage.removeItem('agenda_ai_user');
    localStorage.removeItem('agenda_ai_profile');
    set({ user: null, profile: null, tenant: null });
  },

  setTenant: (tenant: Tenant) => {
    localStorage.setItem('agenda_ai_tenant', JSON.stringify(tenant));
    set({ tenant });
  },

  updateTenant: (data: Partial<Tenant>) => {
    const current = get().tenant;
    if (!current) return;
    const updated: Tenant = {
      ...current,
      ...data,
      settings: {
        ...(current.settings || {
          opening_time: '08:00',
          closing_time: '20:00',
          interval_minutes: 30,
          allow_online_booking: true,
        }),
        ...(data.settings || {}),
      },
    };
    localStorage.setItem('agenda_ai_tenant', JSON.stringify(updated));
    set({ tenant: updated });
  },

  updateProfile: (data: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...data };
    localStorage.setItem('agenda_ai_profile', JSON.stringify(updated));
    set({ profile: updated });
  },
}));
