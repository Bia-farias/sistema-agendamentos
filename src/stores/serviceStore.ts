import { create } from 'zustand';
import { Service } from '../types';
import { initialServices } from '../services/mockData';
import { serviceApiService } from '../services/api/serviceService';

interface ServiceState {
  services: Service[];
  isLoading: boolean;
  selectedCategory: string | 'all';
  activeDrawer: {
    type: 'new' | 'edit' | null;
    serviceId?: string;
  };

  fetchServices: (category?: string) => Promise<void>;
  setSelectedCategory: (category: string | 'all') => void;
  openNewServiceDrawer: () => void;
  openEditServiceDrawer: (serviceId: string) => void;
  closeDrawer: () => void;

  addService: (data: Omit<Service, 'id' | 'created_at'>) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  toggleServiceActive: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_services');
  const initial = saved ? JSON.parse(saved) : initialServices;

  return {
    services: initial,
    isLoading: false,
    selectedCategory: 'all',
    activeDrawer: { type: null },

    fetchServices: async (category?: string) => {
      set({ isLoading: true });
      try {
        const data = await serviceApiService.getAll(category);
        if (data && data.length > 0) {
          set({ services: data, isLoading: false });
          localStorage.setItem('agenda_ai_services', JSON.stringify(data));
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.warn('Falha ao buscar serviços da API:', err);
        set({ isLoading: false });
      }
    },

    setSelectedCategory: (category) => set({ selectedCategory: category }),
    openNewServiceDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditServiceDrawer: (serviceId) => set({ activeDrawer: { type: 'edit', serviceId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addService: async (data) => {
      try {
        const created = await serviceApiService.create(data);
        const updated = [created, ...get().services.filter((s) => s.id !== created.id)];
        localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
        set({ services: updated, activeDrawer: { type: null } });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar serviço na API, salvando localmente:', err);
        const fallbackService: Service = {
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        const updated = [fallbackService, ...get().services];
        localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
        set({ services: updated, activeDrawer: { type: null } });
        return fallbackService;
      }
    },

    updateService: async (id, data) => {
      const updated = get().services.map((s) => (s.id === id ? { ...s, ...data } : s));
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated, activeDrawer: { type: null } });

      try {
        const saved = await serviceApiService.update(id, data);
        const refreshed = get().services.map((s) => (s.id === id ? saved : s));
        set({ services: refreshed });
        localStorage.setItem('agenda_ai_services', JSON.stringify(refreshed));
      } catch (err) {
        console.warn('Sync atualização serviço API:', err);
      }
    },

    toggleServiceActive: async (id) => {
      const target = get().services.find((s) => s.id === id);
      if (!target) return;
      const nextActive = !target.is_active;

      const updated = get().services.map((s) =>
        s.id === id ? { ...s, is_active: nextActive } : s
      );
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated });

      try {
        await serviceApiService.update(id, { is_active: nextActive });
      } catch (err) {
        console.warn('Sync toggle serviço API:', err);
      }
    },

    deleteService: async (id) => {
      const updated = get().services.filter((s) => s.id !== id);
      localStorage.setItem('agenda_ai_services', JSON.stringify(updated));
      set({ services: updated, activeDrawer: { type: null } });

      try {
        await serviceApiService.delete(id);
      } catch (err) {
        console.warn('Sync exclusão serviço API:', err);
      }
    },
  };
});
