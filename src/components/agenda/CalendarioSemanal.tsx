import { useAppointmentStore } from '../../stores/appointmentStore';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { formatCurrency } from '../../utils/format';
import { AppointmentStatus, Appointment } from '../../types';
import { Plus, User, Scissors, Clock, MessageCircle } from 'lucide-react';
import { openWhatsAppForAppointment } from '../../services/whatsapp';

export function CalendarioSemanal({
  startDate,
  viewMode = 'week',
}: {
  startDate: Date;
  viewMode: 'week' | 'day';
}) {
  const {
    appointments,
    selectedProfessionalId,
    selectedStatus,
    openNewAppointmentDrawer,
    openDetailDrawer,
  } = useAppointmentStore();

  const { professionals } = useProfessionalStore();
  const { tenant } = useAuthStore();
  const { addToast } = useUIStore();

  // Generate 7 days starting from startDate
  const daysCount = viewMode === 'week' ? 7 : 1;
  const days: { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];

  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    days.push({
      dateStr,
      dayName: dayNames[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  // Time slots from 08:00 to 19:30 (30 min intervals)
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 19; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    timeSlots.push(`${String(hour).padStart(2, '0')}:30`);
  }

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedProfessionalId !== 'all' && apt.professional_id !== selectedProfessionalId) {
      return false;
    }
    if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const statusColors: Record<
    AppointmentStatus,
    { bg: string; border: string; text: string; dot: string }
  > = {
    pending: {
      bg: 'bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-500/15',
      border: 'border-amber-500/40',
      text: 'text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    confirmed: {
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15',
      border: 'border-emerald-500/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    completed: {
      bg: 'bg-violet-500/10 hover:bg-violet-500/20 dark:bg-violet-500/15',
      border: 'border-violet-500/40',
      text: 'text-violet-700 dark:text-violet-300',
      dot: 'bg-violet-500',
    },
    cancelled: {
      bg: 'bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 opacity-60',
      border: 'border-rose-500/30',
      text: 'text-rose-700 dark:text-rose-300 line-through',
      dot: 'bg-rose-500',
    },
  };

  return (
    <div className="bg-white dark:bg-[#121215] border border-violet-100/80 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Calendar Header: Days of the week */}
      <div className="grid grid-cols-[60px_repeat(auto-fit,minmax(120px,1fr))] border-b border-violet-100/70 dark:border-zinc-800 bg-[#faf9ff] dark:bg-zinc-900/50 sticky top-0 z-10">
        {/* Time column placeholder */}
        <div className="p-3 text-center text-xs font-bold text-zinc-400 border-r border-violet-100/70 dark:border-zinc-800">
          Hora
        </div>

        {/* Days Header */}
        {days.map((day) => (
          <div
            key={day.dateStr}
            className={`p-3 text-center border-r border-violet-100/60 dark:border-zinc-800/60 last:border-r-0 transition-colors ${
              day.isToday ? 'bg-violet-50/70 dark:bg-violet-500/10' : ''
            }`}
          >
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              {day.dayName}
            </span>
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold mt-0.5 ${
                day.isToday
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-400/25'
                  : 'text-zinc-800 dark:text-zinc-200'
              }`}
            >
              {day.dayNumber}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Body: Grid of Time Slots & Appointments */}
      <div className="overflow-y-auto max-h-[640px] divide-y divide-zinc-100 dark:divide-zinc-800/40">
        {timeSlots.map((slot) => (
          <div
            key={slot}
            className="grid grid-cols-[60px_repeat(auto-fit,minmax(120px,1fr))] min-h-[58px] group"
          >
            {/* Time Slot Label */}
            <div className="p-2 text-center text-[11px] font-mono font-medium text-zinc-400 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20 select-none">
              {slot}
            </div>

            {/* Columns for each day */}
            {days.map((day) => {
              // Find appointments starting in this slot on this day
              const slotAppointments = filteredAppointments.filter(
                (apt) => apt.date === day.dateStr && apt.start_time === slot
              );

              return (
                <div
                  key={`${day.dateStr}-${slot}`}
                  className={`p-1 border-r border-violet-100/50 dark:border-zinc-800/40 last:border-r-0 relative hover:bg-violet-50/40 dark:hover:bg-zinc-800/20 transition-colors flex flex-col gap-1 ${
                    day.isToday ? 'bg-violet-50/20 dark:bg-violet-500/5' : ''
                  }`}
                >
                  {slotAppointments.length > 0 ? (
                    slotAppointments.map((apt) => {
                      const colors = statusColors[apt.status];
                      return (
                        <div
                          key={apt.id}
                          onClick={() => openDetailDrawer(apt.id)}
                          className={`p-2 rounded-xl border ${colors.bg} ${colors.border} cursor-pointer transition-all duration-150 shadow-xs hover:shadow-md hover:scale-[1.01]`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {apt.customer_name}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsAppForAppointment(
                                    apt,
                                    tenant?.name || 'Studio Prime',
                                    apt.status === 'confirmed' ? 'confirmation' : 'reminder'
                                  );
                                  addToast({
                                    type: 'success',
                                    title: 'WhatsApp Aberto',
                                    message: `Redirecionando com os dados do agendamento de ${apt.customer_name}...`,
                                  });
                                }}
                                className="p-0.5 rounded text-emerald-600 hover:text-white hover:bg-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-600 transition-colors"
                                title="Enviar agendamento via WhatsApp"
                              >
                                <MessageCircle size={12} />
                              </button>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                            </div>
                          </div>
                          <p className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate mt-0.5 font-medium">
                            {apt.service_name}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-zinc-400 mt-1">
                            <span>{apt.professional_name.split(' ')[0]}</span>
                            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-200">
                              {formatCurrency(apt.total_price)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Empty Slot: Clickable button to open New Appointment Drawer */
                    <button
                      onClick={() =>
                        openNewAppointmentDrawer({
                          date: day.dateStr,
                          time: slot,
                          professionalId:
                            selectedProfessionalId !== 'all'
                              ? selectedProfessionalId
                              : undefined,
                        })
                      }
                      className="w-full h-full min-h-[46px] rounded-xl opacity-0 group-hover:opacity-100 hover:!opacity-100 flex items-center justify-center text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/60 dark:hover:bg-violet-500/10 transition-all text-xs font-semibold gap-1"
                      title="Agendar neste horário"
                    >
                      <Plus size={14} />
                      <span className="hidden sm:inline">Agendar</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
