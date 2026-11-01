import { apiClient } from './apiClient';
import { Service } from '../../types';

function mapBackendService(s: any): Service {
  return {
    id: s.id,
    tenant_id: s.tenantId,
    name: s.name,
    description: s.description || undefined,
    category: s.category || 'Geral',
    price: Number(s.price),
    duration_minutes: s.durationMinutes,
    is_active: Boolean(s.isActive),
    color: s.color || undefined,
    created_at: typeof s.createdAt === 'string' ? s.createdAt : new Date(s.createdAt || Date.now()).toISOString(),
  };
}

export const serviceApiService = {
  async getAll(category?: string): Promise<Service[]> {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiClient.get<any[]>(`/services${query}`);
    return (res || []).map(mapBackendService);
  },

  async getById(id: string): Promise<Service> {
    const res = await apiClient.get<any>(`/services/${id}`);
    return mapBackendService(res);
  },

  async create(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const res = await apiClient.post<any>('/services', {
      name: service.name,
      description: service.description || null,
      category: service.category || 'Geral',
      price: Number(service.price),
      durationMinutes: service.duration_minutes || 30,
      color: service.color || '#6366f1',
      isActive: service.is_active ?? true,
    });

    return mapBackendService(res);
  },

  async update(id: string, updates: Partial<Service>): Promise<Service> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description || null;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.duration_minutes !== undefined) payload.durationMinutes = updates.duration_minutes;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.is_active !== undefined) payload.isActive = updates.is_active;

    const res = await apiClient.put<any>(`/services/${id}`, payload);
    return mapBackendService(res);
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.delete(`/services/${id}`);
    return true;
  },
};
