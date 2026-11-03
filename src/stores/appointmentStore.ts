import { create } from 'zustand';
import { Appointment, AppointmentStatus, DashboardKPIs } from '../types';
import { initialAppointments, getTodayDateString } from '../services/mockData';
import { appointmentApiService } from '../services/api/appointmentService';

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  selectedDate: string; // YYYY-MM-DD
  selectedProfessionalId: string | 'all';
  selectedStatus: AppointmentStatus | 'all';
  activeDrawer: {
    type: 'new' | 'detail' | null;
    appointmentId?: string;
    prefilledSlot?: { date: string; time: string; professionalId?: string };
  };

  fetchAppointments: (params?: {
    date?: string;
    professionalId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setSelectedProfessionalId: (id: string | 'all') => void;
  setSelectedStatus: (status: AppointmentStatus | 'all') => void;
  openNewAppointmentDrawer: (slot?: { date: string; time: string; professionalId?: string }) => void;
  openDetailDrawer: (appointmentId: string) => void;
  closeDrawer: () => void;

  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<Appointment>;
  updateAppointment: (id: string, data: Partial<Appointment>) => Promise<void>;
  updateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;

  getKPIs: () => DashboardKPIs;
  getTodayAppointments: () => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_appointments');
  const initial = saved ? JSON.parse(saved) : initialAppointments;

  return {
    appointments: initial,
    isLoading: false,
    selectedDate: getTodayDateString(),
    selectedProfessionalId: 'all',
    selectedStatus: 'all',
    activeDrawer: { type: null },

    fetchAppointments: async (params) => {
      set({ isLoading: true });
      try {
        const data = await appointmentApiService.getAll(params);
        if (data && data.length > 0) {
          set({ appointments: data, isLoading: false });
          localStorage.setItem('agenda_ai_appointments', JSON.stringify(data));
        } else {
          set({ isLoading: false });
        }
      } catch (err) {
        console.warn('Falha ao buscar agendamentos da API:', err);
        set({ isLoading: false });
      }
    },

    setSelectedDate: (date: string) => set({ selectedDate: date }),
    setSelectedProfessionalId: (id: string | 'all') => set({ selectedProfessionalId: id }),
    setSelectedStatus: (status: AppointmentStatus | 'all') => set({ selectedStatus: status }),

    openNewAppointmentDrawer: (prefilledSlot) =>
      set({ activeDrawer: { type: 'new', prefilledSlot } }),

    openDetailDrawer: (appointmentId: string) =>
      set({ activeDrawer: { type: 'detail', appointmentId } }),

    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addAppointment: async (data) => {
      try {
        const created = await appointmentApiService.create(data);
        const updated = [created, ...get().appointments.filter((a) => a.id !== created.id)];
        localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
        set({ appointments: updated, activeDrawer: { type: null } });
        return created;
      } catch (err: any) {
        // Se for erro de conflito de horário (409), repassamos para a interface exibir aviso
        if (err?.statusCode === 409) {
          throw err;
        }

        console.warn('Erro ao salvar agendamento na API, mantendo localmente:', err);
        const fallbackApt: Appointment = {
          ...data,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        };
        const updated = [fallbackApt, ...get().appointments];
        localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
        set({ appointments: updated, activeDrawer: { type: null } });
        return fallbackApt;
      }
    },

    updateAppointment: async (id: string, data: Partial<Appointment>) => {
      const updated = get().appointments.map((apt) =>
        apt.id === id ? { ...apt, ...data } : apt
      );
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated });

      try {
        const saved = await appointmentApiService.update(id, data);
        const refreshed = get().appointments.map((apt) => (apt.id === id ? saved : apt));
        set({ appointments: refreshed });
        localStorage.setItem('agenda_ai_appointments', JSON.stringify(refreshed));
      } catch (err) {
        console.warn('Sync atualização agendamento API:', err);
      }
    },

    updateStatus: async (id: string, status: AppointmentStatus) => {
      const updated = get().appointments.map((apt) =>
        apt.id === id ? { ...apt, status } : apt
      );
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated });

      try {
        await appointmentApiService.updateStatus(id, status);
      } catch (err) {
        console.warn('Sync status agendamento API:', err);
      }
    },

    deleteAppointment: async (id: string) => {
      const updated = get().appointments.filter((apt) => apt.id !== id);
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated, activeDrawer: { type: null } });

      try {
        await appointmentApiService.delete(id);
      } catch (err) {
        console.warn('Sync exclusão agendamento API:', err);
      }
    },

    getTodayAppointments: () => {
      const today = getTodayDateString();
      return get()
        .appointments.filter((apt) => apt.date === today)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    },

    getKPIs: () => {
      const today = getTodayDateString();
      const todayApts = get().appointments.filter((apt) => apt.date === today);

      const todayRevenue = todayApts
        .filter((apt) => apt.status !== 'cancelled')
        .reduce((sum, apt) => sum + (apt.total_price || 0), 0);

      const todayCompletedCount = todayApts.filter((a) => a.status === 'completed').length;
      const todayPendingCount = todayApts.filter((a) => a.status === 'pending').length;

      const totalCapacitySlots = 32;
      const bookedSlots = todayApts.filter((a) => a.status !== 'cancelled').length;
      const occupancyRate = Math.min(Math.round((bookedSlots / totalCapacitySlots) * 100), 100);

      return {
        todayRevenue,
        todayAppointmentsCount: todayApts.length,
        todayPendingCount,
        todayCompletedCount,
        newCustomersThisMonth: 0,
        occupancyRate: occupancyRate || 0,
        weeklyRevenueChange: 0,
      };
    },
  };
});
