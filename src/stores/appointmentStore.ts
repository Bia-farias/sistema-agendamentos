import { create } from 'zustand';
import { Appointment, AppointmentStatus, DashboardKPIs } from '../types';
import { initialAppointments, getTodayDateString } from '../services/mockData';
import { appointmentApiService } from '../services/api/appointmentService';
import { isSupabaseConfigured } from '../services/supabase';

interface AppointmentState {
  appointments: Appointment[];
  selectedDate: string; // YYYY-MM-DD
  selectedProfessionalId: string | 'all';
  selectedStatus: AppointmentStatus | 'all';
  activeDrawer: {
    type: 'new' | 'detail' | null;
    appointmentId?: string;
    prefilledSlot?: { date: string; time: string; professionalId?: string };
  };

  setSelectedDate: (date: string) => void;
  setSelectedProfessionalId: (id: string | 'all') => void;
  setSelectedStatus: (status: AppointmentStatus | 'all') => void;
  openNewAppointmentDrawer: (slot?: { date: string; time: string; professionalId?: string }) => void;
  openDetailDrawer: (appointmentId: string) => void;
  closeDrawer: () => void;

  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Appointment;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  updateStatus: (id: string, status: AppointmentStatus) => void;
  deleteAppointment: (id: string) => void;

  getKPIs: () => DashboardKPIs;
  getTodayAppointments: () => Appointment[];
}

export const useAppointmentStore = create<AppointmentState>((set, get) => {
  const saved = localStorage.getItem('agenda_ai_appointments');
  const initial = saved ? JSON.parse(saved) : initialAppointments;

  return {
    appointments: initial,
    selectedDate: getTodayDateString(),
    selectedProfessionalId: 'all',
    selectedStatus: 'all',
    activeDrawer: { type: null },

    setSelectedDate: (date: string) => set({ selectedDate: date }),
    setSelectedProfessionalId: (id: string | 'all') => set({ selectedProfessionalId: id }),
    setSelectedStatus: (status: AppointmentStatus | 'all') => set({ selectedStatus: status }),

    openNewAppointmentDrawer: (prefilledSlot) =>
      set({ activeDrawer: { type: 'new', prefilledSlot } }),

    openDetailDrawer: (appointmentId: string) =>
      set({ activeDrawer: { type: 'detail', appointmentId } }),

    closeDrawer: () => set({ activeDrawer: { type: null } }),

    addAppointment: (data) => {
      const newApt: Appointment = {
        ...data,
        id: `apt-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const updated = [newApt, ...get().appointments];
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        appointmentApiService.create(data).catch((err: unknown) => {
          console.warn('Sync agendamento Supabase (aviso de rede):', err);
        });
      }

      return newApt;
    },

    updateAppointment: (id: string, data: Partial<Appointment>) => {
      const updated = get().appointments.map((apt) =>
        apt.id === id ? { ...apt, ...data } : apt
      );
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated });

      if (isSupabaseConfigured()) {
        appointmentApiService.update(id, data).catch((err: unknown) => {
          console.warn('Sync atualização agendamento Supabase:', err);
        });
      }
    },

    updateStatus: (id: string, status: AppointmentStatus) => {
      const updated = get().appointments.map((apt) =>
        apt.id === id ? { ...apt, status } : apt
      );
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated });

      if (isSupabaseConfigured()) {
        appointmentApiService.updateStatus(id, status).catch((err: unknown) => {
          console.warn('Sync status agendamento Supabase:', err);
        });
      }
    },

    deleteAppointment: (id: string) => {
      const updated = get().appointments.filter((apt) => apt.id !== id);
      localStorage.setItem('agenda_ai_appointments', JSON.stringify(updated));
      set({ appointments: updated, activeDrawer: { type: null } });

      if (isSupabaseConfigured()) {
        appointmentApiService.delete(id).catch((err: unknown) => {
          console.warn('Sync exclusão agendamento Supabase:', err);
        });
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

      // Estimated occupancy rate (assuming 8 hours capacity = 16 slots of 30min per 4 professionals = 64 slots)
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
