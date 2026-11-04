const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface PublicSalonData {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  description?: string;
  address?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  primaryColor?: string;
  openingTime: string;
  closingTime: string;
  intervalMinutes: number;
  allowOnlineBooking: boolean;
  services: Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    durationMinutes: number;
    color?: string;
  }>;
  professionals: Array<{
    id: string;
    name: string;
    role: string;
    specialties: string[];
    avatarUrl?: string;
    color?: string;
    bio?: string;
    portfolioUrls?: string[];
    workingHoursStart: string;
    workingHoursEnd: string;
    breakStart?: string;
    breakEnd?: string;
    workingDays: number[];
  }>;
}

export interface PublicBusySlotsResponse {
  date: string;
  openingTime: string;
  closingTime: string;
  intervalMinutes: number;
  busySlots: Array<{
    id: string;
    professionalId: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }>;
}

export interface BookPublicAppointmentInput {
  serviceId: string;
  professionalId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

export const publicScheduleService = {
  async getSalon(slug: string): Promise<PublicSalonData> {
    const res = await fetch(`${BASE_URL}/public/schedule/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.message || 'Estabelecimento não encontrado');
    }

    return data.data;
  },

  async getBusySlots(
    slug: string,
    date: string,
    professionalId?: string
  ): Promise<PublicBusySlotsResponse> {
    const params = new URLSearchParams({ date });
    if (professionalId) {
      params.append('professionalId', professionalId);
    }

    const res = await fetch(
      `${BASE_URL}/public/schedule/${encodeURIComponent(slug)}/slots?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.message || 'Erro ao consultar horários disponíveis');
    }

    return data.data;
  },

  async bookAppointment(slug: string, input: BookPublicAppointmentInput) {
    const res = await fetch(`${BASE_URL}/public/schedule/${encodeURIComponent(slug)}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.message || 'Não foi possível confirmar seu agendamento.');
    }

    return data.data;
  },
};

