import { useState } from 'react';
import { useCustomerStore } from '../../stores/customerStore';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import {
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Sparkles,
  MessageCircle,
  Edit2,
  Trash2,
  Clock,
  Scissors,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import {
  createWhatsAppLink,
  generateReactivationMessage,
  openWhatsAppForAppointment,
} from '../../services/whatsapp';

export function ClienteDetalheDrawer() {
  const {
    customers,
    activeDrawer,
    closeDrawer,
    openEditCustomerDrawer,
    deleteCustomer,
  } = useCustomerStore();
  const { appointments, openNewAppointmentDrawer } = useAppointmentStore();
  const { tenant } = useAuthStore();
  const { addToast } = useUIStore();

  const isOpen = activeDrawer.type === 'detail';
  const customer = customers.find((c) => c.id === activeDrawer.customerId);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!customer) return null;

  // Filter customer's appointments
  const customerAppointments = appointments.filter(
    (a) => a.customer_id === customer.id || a.customer_phone === customer.phone
  );

  const handleWhatsApp = () => {
    const upcomingApt = customerAppointments
      .filter((a) => a.status !== 'cancelled' && a.status !== 'completed')
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))[0];

    const lastApt = !upcomingApt
      ? customerAppointments.sort((a, b) => (b.date + b.start_time).localeCompare(a.date + a.start_time))[0]
      : undefined;

    const targetApt = upcomingApt || lastApt;

    if (targetApt) {
      openWhatsAppForAppointment(
        targetApt,
        tenant?.name || 'Studio Prime',
        targetApt.status === 'confirmed' ? 'confirmation' : 'reminder'
      );
      addToast({
        type: 'success',
        title: 'WhatsApp Aberto',
        message: `Redirecionando com os dados do agendamento de ${customer.name}...`,
      });
    } else {
      const message = generateReactivationMessage(customer, tenant?.name || 'Studio Prime');
      const link = createWhatsAppLink(customer.phone, message);
      window.open(link, '_blank', 'noopener,noreferrer');
      addToast({
        type: 'info',
        title: 'WhatsApp Aberto',
        message: `Iniciando conversa no WhatsApp com ${customer.name}...`,
      });
    }
  };

  const handleDelete = () => {
    deleteCustomer(customer.id);
    addToast({
      type: 'info',
      title: 'Cliente Removido',
      message: `${customer.name} foi removido da sua base.`,
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Perfil do Cliente"
      description={`Cliente desde ${formatDate(customer.created_at)}`}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          {!isConfirmingDelete ? (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1.5 font-medium p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} /> Excluir Cliente
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-bold">Excluir este cliente?</span>
              <Button size="xs" variant="danger" onClick={handleDelete}>
                Sim
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => setIsConfirmingDelete(false)}
              >
                Não
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 size={14} />}
              onClick={() => openEditCustomerDrawer(customer.id)}
            >
              Editar
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Calendar size={14} />}
              onClick={() => {
                closeDrawer();
                openNewAppointmentDrawer();
              }}
            >
              Novo Agendamento
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Customer Header Card */}
        <div className="p-5 rounded-2xl bg-violet-50/40 dark:bg-[#181424] border border-violet-100 dark:border-violet-900/30 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <Avatar name={customer.name} size="xl" className="shadow-md" />
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {customer.name}
              </h3>
              {customer.is_vip && (
                <Badge variant="warning" size="sm">
                  <Sparkles size={11} className="mr-1 text-amber-500" /> VIP
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-violet-500" />
                {formatPhone(customer.phone)}
              </span>
              {customer.email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-violet-500" />
                  {customer.email}
                </span>
              )}
              {customer.birth_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-violet-500" />
                  Niver: {formatDate(customer.birth_date)}
                </span>
              )}
            </div>

            <div className="pt-2">
              <Button
                size="xs"
                variant="success"
                leftIcon={<MessageCircle size={14} />}
                onClick={handleWhatsApp}
              >
                Abrir WhatsApp do Cliente
              </Button>
            </div>
          </div>
        </div>

        {/* Lifetime Value & Visits KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-violet-50/30 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total Investido
            </span>
            <span className="text-lg font-extrabold text-violet-600 dark:text-violet-400 mt-1 block">
              {formatCurrency(customer.total_spent || 0)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-violet-50/30 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Atendimentos
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 block">
              {customer.appointments_count || customerAppointments.length}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-violet-50/30 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 text-center">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Última Visita
            </span>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mt-1.5 block">
              {customer.last_visit_at ? formatDate(customer.last_visit_at) : 'Recente'}
            </span>
          </div>
        </div>

        {/* Customer Notes */}
        {customer.notes && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
            <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">
              Preferências & Observações:
            </span>
            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {customer.notes}
            </p>
          </div>
        )}

        {/* Appointment History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Histórico de Atendimentos ({customerAppointments.length})
            </h4>
          </div>

          {customerAppointments.length === 0 ? (
            <p className="text-xs text-zinc-400 italic p-3 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-xl">
              Nenhum agendamento registrado ainda.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {customerAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl bg-white dark:bg-[#181424] border border-violet-100/80 dark:border-violet-900/30 shadow-sm flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">
                      {apt.service_name}
                    </p>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                      <Calendar size={12} /> {formatDate(apt.date)} às {apt.start_time} • {apt.professional_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {formatCurrency(apt.total_price)}
                      </span>
                      <span className="text-[10px] text-emerald-500 capitalize font-medium">
                        {apt.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        openWhatsAppForAppointment(
                          apt,
                          tenant?.name || 'Studio Prime',
                          apt.status === 'confirmed' ? 'confirmation' : 'reminder'
                        );
                        addToast({
                          type: 'success',
                          title: 'WhatsApp Aberto',
                          message: `Redirecionando com os dados do agendamento...`,
                        });
                      }}
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors cursor-pointer"
                      title="Enviar dados deste agendamento pelo WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
