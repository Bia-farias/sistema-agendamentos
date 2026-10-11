import { create } from 'zustand';
import { Professional } from '../types';
import { initialProfessionals } from '../services/mockData';
import { professionalApiService } from '../services/api/professionalService';
import { isSupabaseConfigured } from '../services/supabase';

interface ProfessionalState {
  professionals: Professional[];
  activeDrawer: {
    type: 'new' | 'edit' | null;
    professionalId?: string;
  };

  openNewProfessionalDrawer: () => void;
  openEditProfessionalDrawer: (professionalId: string) => void;
  closeDrawer: () => void;

  addProfessional: (data: Omit<Professional, 'id'>) => Professional;
  updateProfessional: (id: string, data: Partial<Professional>) => void;
  toggleProfessionalActive: (id: string) => void;
  deleteProfessional: (id: string) => void;
}

export const useProfessionalStore = create<ProfessionalState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_professionals');
  const initial = saved ? JSON.parse(saved) : initialProfessionals;

  return {
    professionals: initial,
    activeDrawer: { type: null },

    openNewProfessionalDrawer: () => set({ activeDrawer: { type: 'new' } }),
    openEditProfessionalDrawer: (professionalId) =>
      set({ activeDrawer: { type: 'edit', professionalId } }),
    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addProfessional: (data) => {
      const newProf: Professional = {
        ...data,
        id: `pro-${Date.now()}`,
      };
      const updated = [...get().professionals, newProf];
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        professionalApiService.create(data).catch((err) => {
          console.warn('Sync profissional Supabase:', err);
        });
      }

      return newProf;
    },

    updateProfessional: (id, data) => {
      const updated = get().professionals.map((p) => (p.id === id ? { ...p, ...data } : p));
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        professionalApiService.update(id, data).catch((err) => {
          console.warn('Sync atualização profissional Supabase:', err);
        });
      }
    },

    toggleProfessionalActive: (id) => {
      const target = get().professionals.find((p) => p.id === id);
      const updated = get().professionals.map((p) =>
        p.id === id ? { ...p, is_active: !p.is_active } : p
      );
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated });

      if (isSupabaseConfigured() && target) {
        professionalApiService.update(id, { is_active: !target.is_active }).catch((err: unknown) => {
          console.warn('Sync toggle profissional Supabase:', err);
        });
      }
    },

    deleteProfessional: (id) => {
      const updated = get().professionals.filter((p) => p.id !== id);
      localStorage.setItem('agenda_ai_professionals', JSON.stringify(updated));
      set({ professionals: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        professionalApiService.delete(id).catch((err: unknown) => {
          console.warn('Sync exclusão profissional Supabase:', err);
        });
      }
    },
  };
});
