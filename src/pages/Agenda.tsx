import { useState, useEffect } from 'react';
import { useAppointmentStore } from '../stores/appointmentStore';
import { FiltrosAgenda } from '../components/agenda/FiltrosAgenda';
import { CalendarioSemanal } from '../components/agenda/CalendarioSemanal';

export default function Agenda() {
  const { fetchAppointments } = useAppointmentStore();
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Compute current week's Monday (or Sunday) as starting date
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    date.setDate(diff);
    return date;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getStartOfWeek(new Date()));

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentWeekStart(d);
  };

  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Agenda de Atendimentos
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Organize horários, acompanhe status e agende novos atendimentos com facilidade.
        </p>
      </div>

      {/* Top Controls Toolbar */}
      <FiltrosAgenda
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentWeekStart={currentWeekStart}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />

      {/* Interactive Time Grid Calendar */}
      <CalendarioSemanal
        startDate={currentWeekStart}
        viewMode={viewMode}
      />
    </div>
  );
}
