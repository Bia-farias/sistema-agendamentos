import { create } from 'zustand';
import { Customer } from '../types';
import { initialCustomers } from '../services/mockData';
import { customerApiService } from '../services/api/customerService';
import { isSupabaseConfigured } from '../services/supabase';

interface CustomerState {
  customers: Customer[];
  searchQuery: string;
  filterTab: 'all' | 'active' | 'inactive' | 'vip';
  activeDrawer: {
    type: 'new' | 'edit' | 'detail' | null;
    customerId?: string;
  };

  setSearchQuery: (query: string) => void;
  setFilterTab: (tab: 'all' | 'active' | 'inactive' | 'vip') => void;
  openNewCustomerDrawer: () => void;
  openEditCustomerDrawer: (customerId: string) => void;
  openDetailDrawer: (customerId: string) => void;
  closeDrawer: () => void;

  addCustomer: (data: Omit<Customer, 'id' | 'created_at' | 'total_spent' | 'appointments_count'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getFilteredCustomers: () => Customer[];
}

export const useCustomerStore = create<CustomerState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_customers');
  const initial = saved ? JSON.parse(saved) : initialCustomers;

  return {
    customers: initial,
    searchQuery: '',
    filterTab: 'all',
    activeDrawer: { type: null },

    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterTab: (filterTab) => set({ filterTab }),

    openNewCustomerDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditCustomerDrawer: (customerId) => set({ activeDrawer: { type: 'edit', customerId } }),
    openDetailDrawer: (customerId) => set({ activeDrawer: { type: 'detail', customerId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addCustomer: (data) => {
      const newCustomer: Customer = {
        ...data,
        id: `cust-${Date.now()}`,
        total_spent: 0,
        appointments_count: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      const updated = [newCustomer, ...get().customers];
      localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
      set({ customers: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        customerApiService.create(data).catch((err: unknown) => {
          console.warn('Sync cliente Supabase:', err);
        });
      }

      return newCustomer;
    },

    updateCustomer: (id, data) => {
      const updated = get().customers.map((c) => (c.id === id ? { ...c, ...data } : c));
      localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
      set({ customers: updated });

      if (isSupabaseConfigured()) {
        customerApiService.update(id, data).catch((err: unknown) => {
          console.warn('Sync atualização cliente Supabase:', err);
        });
      }
    },

    deleteCustomer: (id) => {
      const updated = get().customers.filter((c) => c.id !== id);
      localStorage.setItem('agenda_ai_customers', JSON.stringify(updated));
      set({ customers: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        customerApiService.delete(id).catch((err: unknown) => {
          console.warn('Sync exclusão cliente Supabase:', err);
        });
      }
    },

    getFilteredCustomers: () => {
      const { customers, searchQuery, filterTab } = get();

      return customers.filter((c) => {
        // Search by name, phone or email
        const matchesQuery =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesQuery) return false;

        if (filterTab === 'vip') return c.is_vip;
        if (filterTab === 'inactive') {
          // If last visit was more than 45 days ago or undefined
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
