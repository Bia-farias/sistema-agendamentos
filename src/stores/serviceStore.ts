import { create } from 'zustand';
import { Service } from '../types';
import { initialServices } from '../services/mockData';
import { serviceApiService } from '../services/api/serviceService';
import { isSupabaseConfigured } from '../services/supabase';

interface ServiceState {
  services: Service[];
  selectedCategory: string | 'all';
  activeDrawer: {
    type: 'new' | 'edit' | null;
    serviceId?: string;
  };

  setSelectedCategory: (category: string | 'all') => void;
  openNewServiceDrawer: () => void;
  openEditServiceDrawer: (serviceId: string) => void;
  closeDrawer: () => void;

  addService: (data: Omit<Service, 'id' | 'created_at'>) => Service;
  updateService: (id: string, data: Partial<Service>) => void;
  toggleServiceActive: (id: string) => void;
  deleteService: (id: string) => void;
}

export const useServiceStore = create<ServiceState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_services');
  const initial = saved ? JSON.parse(saved) : initialServices;

  return {
    services: initial,
    selectedCategory: 'all',
    activeDrawer: { type: null },

    setSelectedCategory: (category) => set({ selectedCategory: category }),
    openNewServiceDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditServiceDrawer: (serviceId) => set({ activeDrawer: { type: 'edit', serviceId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addService: (data) => {
      const newService: Service = {
        ...data,
        id: `srv-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const updated = [newService, ...get().services];
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        serviceApiService.create(data).catch((err) => {
          console.warn('Sync serviço Supabase:', err);
        });
      }

      return newService;
    },

    updateService: (id, data) => {
      const updated = get().services.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        serviceApiService.update(id, data).catch((err: unknown) => {
          console.warn('Sync atualização serviço Supabase:', err);
        });
      }
    },

    toggleServiceActive: (id) => {
      const target = get().services.find((s) => s.id === id);
      const updated = get().services.map((s) =>
        s.id === id ? { ...s, is_active: !s.is_active } : s
      );
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated });

      if (isSupabaseConfigured() && target) {
        serviceApiService.update(id, { is_active: !target.is_active }).catch((err: unknown) => {
          console.warn('Sync toggle serviço Supabase:', err);
        });
      }
    },

    deleteService: (id) => {
      const updated = get().services.filter((s) => s.id !== id);
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        serviceApiService.delete(id).catch((err: unknown) => {
          console.warn('Sync exclusão serviço Supabase:', err);
        });
      }
    },
  };
});
