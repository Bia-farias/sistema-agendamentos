import { apiClient } from './apiClient';

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
};

