import { create } from 'zustand';
import { Profile, Tenant, UserRole } from '../types';
import { initialTenant, initialProfiles } from '../services/mockData';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  tenant: Tenant | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  quickLogin: (role: UserRole) => void;
  logout: () => void;
  setTenant: (tenant: Tenant) => void;
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

  login: async (email: string, role: UserRole = 'owner') => {
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
    return true;
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

  updateProfile: (data: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...data };
    localStorage.setItem('agenda_ai_profile', JSON.stringify(updated));
    set({ profile: updated });
  },
}));
