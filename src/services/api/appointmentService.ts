import { apiClient } from './apiClient';
import { Appointment, AppointmentStatus } from '../../types';

function mapBackendAppointment(a: any): Appointment {
  return {
    id: a.id,
    tenant_id: a.tenantId,
    customer_id: a.clientId || a.customerId,
    customer_name: a.client?.name || a.customerName || '',
    customer_phone: a.client?.phone || a.customerPhone || '',
    service_id: a.serviceId,
    service_name: a.service?.name || a.serviceName || '',
    service_price: Number(a.service?.price || a.servicePrice || a.totalPrice || 0),
    professional_id: a.professionalId,
    professional_name: a.professional?.name || a.professionalName || '',
    date: a.date,
    start_time: a.startTime,
    end_time: a.endTime,
    duration_minutes: a.durationMinutes,
    status: a.status ? (a.status.toLowerCase() as AppointmentStatus) : 'pending',
    notes: a.notes || undefined,
    payment_method: a.paymentMethod ? (a.paymentMethod.toLowerCase() as any) : 'unpaid',
    total_price: Number(a.totalPrice || 0),
    created_at: typeof a.createdAt === 'string' ? a.createdAt : new Date(a.createdAt || Date.now()).toISOString(),
  };
}

export const appointmentApiService = {
  async getAll(params?: {
    date?: string;
    professionalId?: string;
    clientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Appointment[]> {
    const searchParams = new URLSearchParams();
    if (params?.date) searchParams.append('date', params.date);
    if (params?.professionalId && params.professionalId !== 'all') {
      searchParams.append('professionalId', params.professionalId);
    }
    if (params?.clientId) searchParams.append('clientId', params.clientId);
    if (params?.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const qs = searchParams.toString();
    const endpoint = `/appointments${qs ? `?${qs}` : ''}`;
    const res = await apiClient.get<any[]>(endpoint);
    return (res || []).map(mapBackendAppointment);
  },

  async getByDate(date: string): Promise<Appointment[]> {
    return this.getAll({ date });
  },

  async getById(id: string): Promise<Appointment> {
    const res = await apiClient.get<any>(`/appointments/${id}`);
    return mapBackendAppointment(res);
  },

  async create(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment> {
    const res = await apiClient.post<any>('/appointments', {
      clientId: appointment.customer_id,
      serviceId: appointment.service_id,
      professionalId: appointment.professional_id,
      date: appointment.date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      durationMinutes: appointment.duration_minutes,
      totalPrice: appointment.total_price,
      paymentMethod: appointment.payment_method?.toUpperCase() || 'UNPAID',
      notes: appointment.notes || null,
    });

    return mapBackendAppointment(res);
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const payload: any = {};
    if (updates.customer_id) payload.clientId = updates.customer_id;
    if (updates.service_id) payload.serviceId = updates.service_id;
    if (updates.professional_id) payload.professionalId = updates.professional_id;
    if (updates.date) payload.date = updates.date;
    if (updates.start_time) payload.startTime = updates.start_time;
    if (updates.end_time) payload.endTime = updates.end_time;
    if (updates.duration_minutes) payload.durationMinutes = updates.duration_minutes;
    if (updates.status) payload.status = updates.status.toUpperCase();
    if (updates.payment_method) payload.paymentMethod = updates.payment_method.toUpperCase();
    if (updates.total_price !== undefined) payload.totalPrice = updates.total_price;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const res = await apiClient.put<any>(`/appointments/${id}`, payload);
    return mapBackendAppointment(res);
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<{ id: string; status: string }> {
    const res = await apiClient.patch<{ id: string; status: string }>(`/appointments/${id}/status`, {
      status: status.toUpperCase(),
    });
    return res;
  },

  async delete(id: string): Promise<{ message: string; cancelled: boolean }> {
    const res = await apiClient.delete<{ message: string; cancelled: boolean }>(`/appointments/${id}`);
    return res;
  },

  // ----------------------------------------------------------------------------
  // AUTOATENDIMENTO PÚBLICO ONLINE
  // ----------------------------------------------------------------------------

  async getPublicSalon(slug: string): Promise<any> {
    return apiClient.get<any>(`/public/schedule/${slug}`);
  },

  async getPublicBusySlots(slug: string, date: string, professionalId?: string): Promise<{
    date: string;
    openingTime: string;
    closingTime: string;
    intervalMinutes: number;
    busySlots: Array<{ startTime: string; endTime: string; professionalId: string }>;
  }> {
    const query = professionalId ? `?date=${date}&professionalId=${professionalId}` : `?date=${date}`;
    return apiClient.get<any>(`/public/schedule/${slug}/slots${query}`);
  },

  async bookPublicAppointment(slug: string, data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    serviceId: string;
    professionalId: string;
    date: string;
    startTime: string;
    notes?: string;
  }): Promise<any> {
    return apiClient.post<any>(`/public/schedule/${slug}/book`, data);
  },
};
