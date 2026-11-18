import { apiClient } from './apiClient';
import { SaasCompany } from '../../types';

export interface CreateSaasCompanyPayload {
  name: string;
  businessType?: string;
  plan?: string;
  phone?: string | null;
  address?: string | null;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface UpdateSaasCompanyPayload {
  name?: string;
  businessType?: string;
  plan?: string;
  phone?: string | null;
  address?: string | null;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string | null;
  isActive?: boolean;
}

export interface MyPageData {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  galleryUrls?: string[];
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  primaryColor?: string | null;
  openingTime: string;
  closingTime: string;
  intervalMinutes: number;
  allowOnlineBooking: boolean;
  activeServicesCount: number;
  activeProfessionalsCount: number;
  totalAppointmentsCount: number;
  publicUrl: string;
}

export interface UpdateMyPagePayload {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  galleryUrls?: string[];
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  primaryColor?: string | null;
  openingTime?: string;
  closingTime?: string;
  intervalMinutes?: number;
  allowOnlineBooking?: boolean;
}

export const tenantApiService = {
  async getMyPage(): Promise<MyPageData> {
    return apiClient.get<MyPageData>('/tenant/my-page');
  },

  async updateMyPage(data: UpdateMyPagePayload): Promise<MyPageData> {
    return apiClient.put<MyPageData>('/tenant/my-page', data);
  },

  async listSaasCompanies(): Promise<SaasCompany[]> {
    return apiClient.get<SaasCompany[]>('/tenant/saas/companies');
  },

  async createSaasCompany(data: CreateSaasCompanyPayload): Promise<SaasCompany> {
    return apiClient.post<SaasCompany>('/tenant/saas/companies', data);
  },

  async updateSaasCompany(id: string, data: UpdateSaasCompanyPayload): Promise<SaasCompany> {
    return apiClient.put<SaasCompany>(`/tenant/saas/companies/${id}`, data);
  },

  async deleteSaasCompany(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/tenant/saas/companies/${id}`);
  },
};

