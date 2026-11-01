import { apiClient } from './apiClient';
import { Customer } from '../../types';

function mapBackendClient(c: any): Customer {
  return {
    id: c.id,
    tenant_id: c.tenantId,
    name: c.name,
    email: c.email || undefined,
    phone: c.phone,
    birth_date: c.birthDate ? new Date(c.birthDate).toISOString().split('T')[0] : undefined,
    notes: c.notes || undefined,
    total_spent: Number(c.totalSpent || 0),
    appointments_count: c.appointmentsCount || c._count?.appointments || 0,
    last_visit_at: c.lastVisitAt ? new Date(c.lastVisitAt).toISOString().split('T')[0] : undefined,
    is_vip: Boolean(c.isVip),
    created_at: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt || Date.now()).toISOString(),
  };
}

export const customerApiService = {
  async getAll(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await apiClient.get<{ clients: any[]; pagination: any }>(`/clients${query}`);
    return (res.clients || []).map(mapBackendClient);
  },

  async getById(id: string): Promise<Customer> {
    const res = await apiClient.get<any>(`/clients/${id}`);
    return mapBackendClient(res);
  },

  async create(customer: Omit<Customer, 'id' | 'created_at' | 'total_spent' | 'appointments_count'>): Promise<Customer> {
    const res = await apiClient.post<any>('/clients', {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || null,
      birthDate: customer.birth_date || null,
      notes: customer.notes || null,
      isVip: Boolean(customer.is_vip),
    });

    return mapBackendClient(res);
  },

  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email || null;
    if (updates.birth_date !== undefined) payload.birthDate = updates.birth_date || null;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;
    if (updates.is_vip !== undefined) payload.isVip = updates.is_vip;

    const res = await apiClient.put<any>(`/clients/${id}`, payload);
    return mapBackendClient(res);
  },

  async delete(id: string): Promise<boolean> {
    await apiClient.delete(`/clients/${id}`);
    return true;
  },
};
