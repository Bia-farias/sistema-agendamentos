import { create } from 'zustand';
import { Customer } from '../types';
import { initialCustomers } from '../services/mockData';
import { customerApiService } from '../services/api/customerService';

interface CustomerState {
  customers: Customer[];
  isLoading: boolean;
  searchQuery: string;
  filterTab: 'all' | 'active' | 'inactive' | 'vip';
  activeDrawer: {
    type: 'new' | 'edit' | 'detail' | null;
    customerId?: string;
  };

  fetchCustomers: (search?: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | 'active' | 'inactive' | 'vip') => void;
  openNewCustomerDrawer: () => void;
  openEditCustomerDrawer: (customerId: string) => void;
  openDetailDrawer: (customerId: string) => void;
  closeDrawer: () => void;

  addCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'total_spent' | 'appointments_count'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getFilteredCustomers: () => Customer[];
}

export const useCustomerStore = create<CustomerState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_customers');
  const initial = saved ? JSON.parse(saved) : initialCustomers;

  return {
    customers: initial,
    isLoading: false,
    searchQuery: '',
    filterTab: 'all',
    activeDrawer: { type: null },

    fetchCustomers: async (search?: string) => {
      set({ isLoading: true });
      try {
        const data = await customerApiService.getAll(search);
        if (data && data.length > 0) {
          set({ customers: data, isLoading: false });
          localStorage.setItem('agenda_ai_customers', JSON.stringify(data));
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.warn('Falha ao buscar clientes da API:', err);
        set({ isLoading: false });
      }
    },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterTab: (filterTab) => set({ filterTab }),

    openNewCustomerDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditCustomerDrawer: (customerId) => set({ activeDrawer: { type: 'edit', customerId } }),
    openDetailDrawer: (customerId) => set({ activeDrawer: { type: 'detail', customerId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addCustomer: async (data) => {
      try {
        const created = await customerApiService.create(data);
        const updated = [created, ...get().customers.filter((c) => c.id !== created.id)];
        localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
        set({ customers: updated, activeDrawer: { type: null } });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar cliente na API, salvando localmente:', err);
        const fallbackCustomer: Customer = {
          ...data,
          id: crypto.randomUUID(),
          total_spent: 0,
          appointments_count: 0,
          created_at: new Date().toISOString().split('T')[0],
        };
        const updated = [fallbackCustomer, ...get().customers];
        localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
        set({ customers: updated, activeDrawer: { type: null } });
        return fallbackCustomer;
      }
    },

    updateCustomer: async (id, data) => {
      const updated = get().customers.map((c) => (c.id === id ? { ...c, ...data } : c));
      localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
      set({ customers: updated });

      try {
        const saved = await customerApiService.update(id, data);
        const refreshed = get().customers.map((c) => (c.id === id ? saved : c));
        set({ customers: refreshed });
        localStorage.setItem('agenda_ai_customers', JSON.stringify(refreshed));
      } catch (err) {
        console.warn('Sync atualização cliente API:', err);
      }
    },

    deleteCustomer: async (id) => {
      const updated = get().customers.filter((c) => c.id !== id);
      localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
      set({ customers: updated, activeDrawer: { type: null } });

      try {
        await customerApiService.delete(id);
      } catch (err) {
        console.warn('Sync exclusão cliente API:', err);
      }
    },

    getFilteredCustomers: () => {
      const { customers, searchQuery, filterTab } = get();

      return customers.filter((c) => {
        const matchesQuery =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        if (filterTab === 'vip') return c.is_vip;
        if (filterTab === 'inactive') {
          return c.appointments_count <= 2;
        }
        if (filterTab === 'active') {
          return c.appointments_count > 2;
        }

        return true;
      });
    },
  };
});
