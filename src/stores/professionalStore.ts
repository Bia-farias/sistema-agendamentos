import { create } from 'zustand';
import { Professional } from '../types';
import { initialProfessionals } from '../services/mockData';
import { professionalApiService } from '../services/api/professionalService';

interface ProfessionalState {
  professionals: Professional[];
  isLoading: boolean;
  activeDrawer: {
    type: 'new' | 'edit' | null;
    professionalId?: string;
  };

  fetchProfessionals: (isActive?: boolean) => Promise<void>;
  openNewProfessionalDrawer: () => void;
  openEditProfessionalDrawer: (professionalId: string) => void;
  closeDrawer: () => void;

  addProfessional: (data: Omit<Professional, 'id'>) => Promise<Professional>;
  updateProfessional: (id: string, data: Partial<Professional>) => Promise<void>;
  toggleProfessionalActive: (id: string) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
}

export const useProfessionalStore = create<ProfessionalState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_professionals');
  const initial = saved ? JSON.parse(saved) : initialProfessionals;

  return {
    professionals: initial,
    isLoading: false,
    activeDrawer: { type: null },

    fetchProfessionals: async (isActive?: boolean) => {
      set({ isLoading: true });
      try {
        const data = await professionalApiService.getAll(isActive);
        if (data && data.length > 0) {
          set({ professionals: data, isLoading: false });
          localStorage.setItem('agenda_ai_professionals', JSON.stringify(data));
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.warn('Falha ao buscar profissionais da API:', err);
        set({ isLoading: false });
      }
    },

    openNewProfessionalDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditProfessionalDrawer: (professionalId) =>
      set({ activeDrawer: { type: 'edit', professionalId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addProfessional: async (data) => {
      try {
        const created = await professionalApiService.create(data);
        const updated = [...get().professionals.filter((p) => p.id !== created.id), created];
        localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
        set({ professionals: updated, activeDrawer: { type: null } });
        return created;
      } catch (err) {
        console.warn('Erro ao salvar profissional na API, salvando localmente:', err);
        const fallbackProf: Professional = {
          ...data,
          id: crypto.randomUUID(),
        };
        const updated = [...get().professionals, fallbackProf];
        localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
        set({ professionals: updated, activeDrawer: { type: null } });
        return fallbackProf;
      }
    },

    updateProfessional: async (id, data) => {
      const updated = get().professionals.map((p) => (p.id === id ? { ...p, ...data } : p));
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated, activeDrawer: { type: null } });

      try {
        const saved = await professionalApiService.update(id, data);
        const refreshed = get().professionals.map((p) => (p.id === id ? saved : p));
        set({ professionals: refreshed });
        localStorage.setItem('agenda_ai_professionals', JSON.stringify(refreshed));
      } catch (err) {
        console.warn('Sync atualização profissional API:', err);
      }
    },

    toggleProfessionalActive: async (id) => {
      const target = get().professionals.find((p) => p.id === id);
      if (!target) return;
      const nextActive = !target.is_active;

      const updated = get().professionals.map((p) =>
        p.id === id ? { ...p, is_active: nextActive } : p
      );
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated });

      try {
        await professionalApiService.update(id, { is_active: nextActive });
      } catch (err) {
        console.warn('Sync toggle profissional API:', err);
      }
    },

    deleteProfessional: async (id) => {
      const updated = get().professionals.filter((p) => p.id !== id);
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated, activeDrawer: { type: null } });

      try {
        await professionalApiService.delete(id);
      } catch (err) {
        console.warn('Sync exclusão profissional API:', err);
      }
    },
  };
});
