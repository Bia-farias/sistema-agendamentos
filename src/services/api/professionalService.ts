import { apiClient } from './apiClient';
import { Professional } from '../../types';

function mapBackendProfessional(p: any): Professional {
  return {
    id: p.id,
    tenant_id: p.tenantId,
    user_id: p.userId || undefined,
    name: p.name,
    email: p.email || undefined,
    phone: p.phone || undefined,
    avatar_url: p.avatarUrl || undefined,
    role: p.role || 'Especialista',
    specialties: Array.isArray(p.specialties) ? p.specialties : [],
    commission_percentage: Number(p.commissionPercentage || 0),
    color: p.color || '#6366f1',
    is_active: Boolean(p.isActive),
    working_hours: {
      start: p.workingHoursStart || '09:00',
      end: p.workingHoursEnd || '19:00',
      days_of_week: Array.isArray(p.workingDays) ? p.workingDays : [1, 2, 3, 4, 5, 6],
    },
  };
}

export const professionalApiService = {
  async getAll(isActive?: boolean): Promise<Professional[]> {
    const query = isActive !== undefined ? `?isActive=${isActive}` : '';
    const res = await apiClient.get<any[]>(`/professionals${query}`);
    return (res || []).map(mapBackendProfessional);
  },

  async getById(id: string): Promise<Professional> {
    const res = await apiClient.get<any>(`/professionals/${id}`);
    return mapBackendProfessional(res);
  },

  async create(professional: Omit<Professional, 'id'>): Promise<Professional> {
    const res = await apiClient.post<any>('/professionals', {
      name: professional.name,
      email: professional.email || null,
      phone: professional.phone || null,
      avatarUrl: professional.avatar_url || null,
      role: professional.role || 'Especialista',
      specialties: professional.specialties || [],
      commissionPercentage: Number(professional.commission_percentage || 0),
      color: professional.color || '#6366f1',
      isActive: professional.is_active ?? true,
      workingHoursStart: professional.working_hours?.start || '09:00',
      workingHoursEnd: professional.working_hours?.end || '19:00',
      workingDays: professional.working_hours?.days_of_week || [1, 2, 3, 4, 5, 6],
    });

    return mapBackendProfessional(res);
  },

  async update(id: string, updates: Partial<Professional>): Promise<Professional> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email || null;
    if (updates.phone !== undefined) payload.phone = updates.phone || null;
    if (updates.avatar_url !== undefined) payload.avatarUrl = updates.avatar_url || null;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.specialties !== undefined) payload.specialties = updates.specialties;
    if (updates.commission_percentage !== undefined) payload.commissionPercentage = Number(updates.commission_percentage);
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.is_active !== undefined) payload.isActive = updates.is_active;
    if (updates.working_hours?.start !== undefined) payload.workingHoursStart = updates.working_hours.start;
    if (updates.working_hours?.end !== undefined) payload.workingHoursEnd = updates.working_hours.end;
    if (updates.working_hours?.days_of_week !== undefined) payload.workingDays = updates.working_hours.days_of_week;

    const res = await apiClient.put<any>(`/professionals/${id}`, payload);
    return mapBackendProfessional(res);
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.delete(`/professionals/${id}`);
    return true;
  },
};
