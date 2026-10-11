import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
  Scissors,
  MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAppointmentStore } from '../stores/appointmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { useServiceStore } from '../stores/serviceStore';
import { useUIStore } from '../stores/uiStore';
import { StatsCard } from '../components/ui/StatsCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCurrency, formatDate, formatPhone } from '../utils/format';
import { openWhatsAppForAppointment } from '../services/whatsapp';
import { AppointmentStatus } from '../types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { tenant, profile } = useAuthStore();
  const { addToast } = useUIStore();
  const {
    appointments,
    getKPIs,
    getTodayAppointments,
    openNewAppointmentDrawer,
    openDetailDrawer,
  } = useAppointmentStore();
  const { customers, openNewCustomerDrawer } = useCustomerStore();
  const { services } = useServiceStore();

  const kpis = getKPIs();
  const todayAppointments = getTodayAppointments();

  const statusVariants: Record<AppointmentStatus, 'warning' | 'success' | 'info' | 'danger'> = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'info',
    cancelled: 'danger',
  };

  const statusLabels: Record<AppointmentStatus, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  // Cálculo dinâmico dos últimos 7 dias baseado nos agendamentos reais
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLabel = dayNames[d.getDay()];

    const dayApts = appointments.filter(
      (a) => a.date === dateStr && a.status !== 'cancelled'
    );
    const revenue = dayApts.reduce((sum, a) => sum + (a.total_price || 0), 0);

    return {
      day: dayLabel,
      revenue,
      appointments: dayApts.length,
    };
  });

  const maxRevenue = Math.max(...weeklyData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-8">
      {/* Top Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2.5">
            Olá, {profile?.full_name?.split(' ')[0] || 'Gestor'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Aqui está o panorama operacional de hoje para <strong>{tenant?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openNewCustomerDrawer()}
            leftIcon={<Users size={15} />}
          >
            + Novo Cliente
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openNewAppointmentDrawer()}
            leftIcon={<Plus size={16} />}
            className="shadow-sm shadow-violet-400/20"
          >
            + Novo Agendamento
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard
          title="Faturamento de Hoje"
          value={formatCurrency(kpis.todayRevenue)}
          trend={{ value: kpis.weeklyRevenueChange, isPositive: true }}
          icon={<DollarSign size={22} />}
          color="emerald"
        />

        <StatsCard
          title="Agendamentos Hoje"
          value={kpis.todayAppointmentsCount}
          subtitle={`${kpis.todayCompletedCount} concluídos • ${kpis.todayPendingCount} pendentes`}
          icon={<Calendar size={22} />}
          color="violet"
        />

        <StatsCard
          title="Novos Clientes (Mês)"
          value={kpis.newCustomersThisMonth}
          trend={{ value: 12, isPositive: true, label: 'vs. mês passado' }}
          icon={<Users size={22} />}
          color="sky"
        />

        <StatsCard
          title="Taxa de Ocupação"
          value={`${kpis.occupancyRate}%`}
          subtitle="Capacidade das salas/cadeiras"
          icon={<TrendingUp size={22} />}
          color="violet"
        />
      </div>

      {/* Main Grid: Today's Agenda + Weekly Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Agenda (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-violet-500" />
                  <span>Agenda de Hoje</span>
                  <Badge variant="primary" size="sm">
                    {todayAppointments.length} horários
                  </Badge>
                </div>
              }
              subtitle="Atendimentos programados para a data de hoje"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  rightIcon={<ArrowRight size={14} />}
                  onClick={() => navigate('/agenda')}
                >
                  Ver Calendário
                </Button>
              }
            />

            {todayAppointments.length === 0 ? (
              <EmptyState
                icon={<Calendar size={24} />}
                title="Nenhum atendimento para hoje"
                description="Os horários agendados para hoje aparecerão aqui em ordem cronológica."
                actionLabel="+ Criar Agendamento"
                onAction={() => openNewAppointmentDrawer()}
              />
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => openDetailDrawer(apt.id)}
                    className="p-4 rounded-2xl bg-white hover:bg-violet-50/40 dark:bg-zinc-900/40 dark:hover:bg-zinc-900 border border-violet-100/80 dark:border-zinc-800/80 hover:border-violet-300 dark:hover:border-violet-500/40 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 text-center shrink-0">
                        <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400 block font-mono">
                          {apt.start_time}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {apt.end_time}
                        </span>
                      </div>

                      <div className="w-px h-8 bg-violet-100 dark:bg-zinc-800 shrink-0" />

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {apt.customer_name}
                          </h4>
                          <Badge variant={statusVariants[apt.status]} size="sm">
                            {statusLabels[apt.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {apt.service_name} • <span className="text-zinc-600 dark:text-zinc-300 font-medium">{apt.professional_name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/50 dark:border-zinc-800">
                      <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatCurrency(apt.total_price)}
                      </span>

                      {/* Botão Whats: API de redirecionamento com informações do agendamento */}
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
                            message: `Redirecionando com as informações do agendamento de ${apt.customer_name}...`,
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white border border-emerald-200/80 dark:border-emerald-800/60 transition-all duration-150 flex items-center gap-1.5 text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer"
                        title="Enviar dados do agendamento pelo WhatsApp"
                      >
                        <MessageCircle size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400 group-hover/btn:text-white" />
                        <span>WhatsApp</span>
                      </button>

                      <span className="text-xs text-violet-500 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 ml-1">
                        Detalhes &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Weekly Revenue Visualizer & Top Services (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Performance Visualizer */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-500" />
                  <span>Faturamento Semanal</span>
                </div>
              }
              subtitle="Desempenho dos últimos 7 dias"
            />

            <div className="pt-2">
              <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
                {weeklyData.map((item, idx) => {
                  const heightPercent = Math.round((item.revenue / maxRevenue) * 100);
                  const isHighest = item.revenue === maxRevenue;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 font-mono">
                        {formatCurrency(item.revenue)} ({item.appointments} atendimentos)
                      </div>

                      <div className="w-full h-32 flex items-end justify-center">
                        <div
                          style={{ height: `${Math.max(heightPercent, 12)}%` }}
                          className={`w-full max-w-[28px] rounded-xl transition-all duration-300 ${
                            isHighest
                              ? 'bg-gradient-to-t from-violet-500 to-purple-400 shadow-md shadow-violet-400/25'
                              : 'bg-violet-100/70 dark:bg-zinc-800 group-hover:bg-violet-300 dark:group-hover:bg-violet-500/60'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Total da Semana:</span>
                <strong className="text-sm text-zinc-900 dark:text-zinc-100 font-extrabold">
                  {formatCurrency(weeklyData.reduce((acc, curr) => acc + curr.revenue, 0))}
                </strong>
              </div>
            </div>
          </Card>

          {/* Top Services Popularity */}
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <Scissors size={18} className="text-violet-500" />
                  <span>Serviços Mais Procurados</span>
                </div>
              }
              subtitle="Catálogo com maior taxa de conversão"
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => navigate('/servicos')}
                >
                  Ver Todos
                </Button>
              }
            />

            {services.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                <Scissors size={28} className="mx-auto mb-2 opacity-30 text-violet-500" />
                <p className="font-semibold text-xs text-zinc-600 dark:text-zinc-300">Nenhum serviço cadastrado ainda</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Cadastre seus serviços para acompanhar o desempenho</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.slice(0, 4).map((service, idx) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-violet-50/30 dark:bg-zinc-900/40 border border-violet-100/70 dark:border-zinc-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-violet-100/80 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 font-bold flex items-center justify-center text-xs">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[170px] sm:max-w-[220px]">
                          {service.name}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {service.category} • {service.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
