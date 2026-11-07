import { useState, useEffect } from 'react';
import { Calendar, Scissors, UserCheck, Sparkles, Plus } from 'lucide-react';
import { useAppointmentStore } from '../stores/appointmentStore';
import { useServiceStore } from '../stores/serviceStore';
import { useProfessionalStore } from '../stores/professionalStore';
import { FiltrosAgenda } from '../components/agenda/FiltrosAgenda';
import { CalendarioSemanal } from '../components/agenda/CalendarioSemanal';
import { Button } from '../components/ui/Button';

export default function Agenda() {
  const {
    appointments,
    fetchAppointments,
    selectedProfessionalId,
    selectedStatus,
    setSelectedProfessionalId,
    setSelectedStatus,
    openNewAppointmentDrawer,
  } = useAppointmentStore();
  const { services, fetchServices, openNewServiceDrawer } = useServiceStore();
  const { professionals, fetchProfessionals, openNewProfessionalDrawer } = useProfessionalStore();
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchProfessionals();
  }, [fetchAppointments, fetchServices, fetchProfessionals]);

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

  const isSystemUnconfigured = services.length === 0 || professionals.length === 0;
  const hasActiveFilters = selectedProfessionalId !== 'all' || selectedStatus !== 'all';
  const filteredAppointments = appointments.filter((apt) => {
    if (selectedProfessionalId !== 'all' && apt.professional_id !== selectedProfessionalId) {
      return false;
    }
    if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
      return false;
    }
    return true;
  });

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

      {/* Contextual Empty State / Onboarding Banner */}
      {isSystemUnconfigured ? (
        <div className="p-5 rounded-2xl border border-dashed border-violet-300 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-950/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/70 dark:border-violet-500/25">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Configure seu catálogo e equipe para liberar a agenda
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed max-w-2xl">
                Para criar seu primeiro agendamento em qualquer horário da grade abaixo, cadastre ao menos um serviço e um profissional responsável.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {services.length === 0 && (
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Scissors size={15} />}
                onClick={() => openNewServiceDrawer()}
              >
                Cadastrar primeiro serviço
              </Button>
            )}
            {professionals.length === 0 && (
              <Button
                size="sm"
                variant={services.length === 0 ? 'secondary' : 'primary'}
                leftIcon={<UserCheck size={15} />}
                onClick={() => openNewProfessionalDrawer()}
              >
                Adicionar profissional
              </Button>
            )}
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-4 sm:p-5 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-200/60 dark:border-violet-500/20">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Sua agenda está pronta para o primeiro atendimento
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Clique em qualquer horário livre na grade abaixo (<strong className="text-violet-600 dark:text-violet-400">+ Agendar</strong>) ou use o botão ao lado para registrar o primeiro agendamento.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={15} />}
            onClick={() => openNewAppointmentDrawer()}
            className="shrink-0"
          >
            Realizar 1º Agendamento
          </Button>
        </div>
      ) : hasActiveFilters && filteredAppointments.length === 0 ? (
        <div className="p-4 rounded-2xl border border-dashed border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
            Nenhum agendamento encontrado para os filtros selecionados (profissional ou status).
          </p>
          <Button
            size="xs"
            variant="secondary"
            onClick={() => {
              setSelectedProfessionalId('all');
              setSelectedStatus('all');
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : null}

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
