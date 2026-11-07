import { apiClient, setAuthToken, ApiError } from './apiClient';
import { Profile, Tenant, UserRole } from '../../types';

interface BackendAuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    phone?: string | null;
    avatarUrl?: string | null;
    tenantId: string;
    createdAt: string | Date;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    businessType: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    logoUrl?: string | null;
    settings?: {
      opening_time: string;
      closing_time: string;
      interval_minutes: number;
      allow_online_booking: boolean;
    };
    createdAt: string | Date;
  };
  token: string;
}

function safeIsoDate(val?: string | Date | null): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function mapBackendAuthData(data: { user: BackendAuthResponse['user']; tenant: BackendAuthResponse['tenant'] }): {
  profile: Profile;
  tenant: Tenant;
} {
  const profile: Profile = {
    id: data.user.id,
    user_id: data.user.id,
    tenant_id: data.user.tenantId,
    full_name: data.user.fullName,
    role: (data.user.role || 'OWNER').toLowerCase() as UserRole,
    email: data.user.email,
    phone: data.user.phone || undefined,
    avatar_url: data.user.avatarUrl || undefined,
    is_active: true,
    created_at: safeIsoDate(data.user.createdAt),
  };

  const tenant: Tenant = {
    id: data.tenant.id,
    name: data.tenant.name,
    slug: data.tenant.slug,
    plan: (data.tenant.plan || 'pro').toLowerCase() as any,
    business_type: (data.tenant.businessType || 'beauty_salon').toLowerCase() as any,
    phone: data.tenant.phone || undefined,
    email: data.tenant.email || undefined,
    logo_url: data.tenant.logoUrl || undefined,
    address: data.tenant.address || undefined,
    settings: data.tenant.settings || {
      opening_time: '08:00',
      closing_time: '20:00',
      interval_minutes: 30,
      allow_online_booking: true,
    },
    created_at: safeIsoDate(data.tenant.createdAt),
  };

  return { profile, tenant };
}

export const authApiService = {
  async signIn(email: string, password: string): Promise<{
    user: { id: string; email: string };
    profile: Profile;
    tenant: Tenant;
    token: string;
  }> {
    const res = await apiClient.post<BackendAuthResponse>('/auth/login', {
      email,
      password,
    });

    if (res.token) {
      setAuthToken(res.token);
    }

    const { profile, tenant } = mapBackendAuthData(res);
    return {
      user: { id: res.user.id, email: res.user.email },
      profile,
      tenant,
      token: res.token,
    };
  },

  async signUpWithTenant(params: {
    email: string;
    password: string;
    fullName: string;
    businessName: string;
    businessType: any;
    businessPhone: string;
  }): Promise<{
    user: { id: string; email: string };
    profile: Profile;
    tenant: Tenant;
    token: string;
  }> {
    const res = await apiClient.post<BackendAuthResponse>('/auth/register', {
      fullName: params.fullName,
      email: params.email,
      password: params.password,
      businessName: params.businessName,
      businessType: params.businessType,
      businessPhone: params.businessPhone,
    });

    if (res.token) {
      setAuthToken(res.token);
    }

    const { profile, tenant } = mapBackendAuthData(res);
    return {
      user: { id: res.user.id, email: res.user.email },
      profile,
      tenant,
      token: res.token,
    };
  },

  async getMe(): Promise<{
    user: { id: string; email: string };
    profile: Profile;
    tenant: Tenant;
  }> {
    const res = await apiClient.get<{
      user: BackendAuthResponse['user'];
      tenant: BackendAuthResponse['tenant'];
    }>('/auth/me');

    const { profile, tenant } = mapBackendAuthData(res);
    return {
      user: { id: res.user.id, email: res.user.email },
      profile,
      tenant,
    };
  },

  async signOut(): Promise<void> {
    setAuthToken(null);
  },

  async resetPassword(email: string): Promise<void> {
    // Integração futura com serviço de envio de e-mail (Resend / SMTP)
    console.log(`Solicitação de recuperação de senha para: ${email}`);
  },
};

export function translateAuthError(message: string): string {
  if (!message) return 'Ocorreu um erro na autenticação.';
  const lower = message.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('incorreto') || lower.includes('incorretos') || lower.includes('401')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('já está cadastrado') || lower.includes('already exists') || lower.includes('409')) {
    return 'Este e-mail já está cadastrado em nossa plataforma.';
  }
  if (lower.includes('inativa') || lower.includes('inactive')) {
    return 'Esta conta de usuário está inativa. Contate o suporte.';
  }
  if (lower.includes('senha deve ter no mínimo') || lower.includes('password')) {
    return 'A senha deve possuir no mínimo 6 caracteres.';
  }
  if (lower.includes('não foi possível conectar') || lower.includes('failed to fetch')) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.';
  }
  return message;
}
