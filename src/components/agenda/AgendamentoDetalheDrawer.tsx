import { useState } from 'react';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useFinancialStore } from '../../stores/financialStore';
import { useProfessionalStore } from '../../stores/professionalStore';
import { PaymentMethod } from '../../types/financeiro';
import { getTodayDateString } from '../../services/mockData';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Coins,
  CreditCard,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPhone } from '../../utils/format';
import {
  openWhatsAppForAppointment,
  createWhatsAppLink,
  generateAppointmentConfirmationMessage,
  generateAppointmentReminderMessage,
  generateAppointmentDetailsMessage,
} from '../../services/whatsapp';
import { AppointmentStatus } from '../../types';

export function AgendamentoDetalheDrawer() {
  const { appointments, activeDrawer, closeDrawer, updateStatus, deleteAppointment } =
    useAppointmentStore();
  const { tenant } = useAuthStore();
  const { addToast } = useUIStore();
  const {
    receivables,
    markReceivablePaid,
    addReceivable,
    updateReceivable,
    deleteReceivable,
  } = useFinancialStore();
  const { professionals } = useProfessionalStore();

  const isOpen = activeDrawer.type === 'detail';
  const appointment = appointments.find((a) => a.id === activeDrawer.appointmentId);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('pix');

  if (!appointment) return null;

  // Busca conta a receber associada a este agendamento
  const receivable = receivables.find((r) => r.appointment_id === appointment.id);

  // Calcula comissão do profissional
  const professional = professionals.find(
    (p) => p.id === appointment.professional_id || p.name === appointment.professional_name
  );
  const commissionRate = professional?.commission_percentage ?? 35;
  const commissionAmount = Math.round((appointment.total_price * commissionRate) / 100);

  const isPaid = receivable
    ? receivable.status === 'paid'
    : appointment.payment_method !== 'unpaid';

  const statusVariant: Record<AppointmentStatus, 'warning' | 'success' | 'info' | 'danger'> = {
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

  const handleStatusChange = (status: AppointmentStatus) => {
    updateStatus(appointment.id, status);

    const today = getTodayDateString();

    if (status === 'completed') {
      // Sincronização automática com o Contas a Receber
      if (receivable) {
        if (receivable.status !== 'paid') {
          markReceivablePaid(receivable.id, selectedPaymentMethod || receivable.payment_method || 'pix');
        }
      } else {
        // Se a conta a receber não existia, cria automaticamente como paga
        addReceivable({
          appointment_id: appointment.id,
          customer_id: appointment.customer_id,
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          service_name: appointment.service_name,
          professional_name: appointment.professional_name,
          description: `Atendimento ${appointment.service_name}`,
          original_amount: appointment.total_price,
          discount: 0,
          surcharge: 0,
          final_amount: appointment.total_price,
          amount_paid: appointment.total_price,
          payment_method: selectedPaymentMethod,
          due_date: appointment.date,
          paid_at: today,
          status: 'paid',
          has_signal: false,
        });
      }

      addToast({
        type: 'success',
        title: 'Atendimento Concluído! 🎉',
        message: `Agendamento finalizado. A conta a receber foi dada como paga e a comissão de ${formatCurrency(commissionAmount)} (${commissionRate}%) foi gerada para ${appointment.professional_name}!`,
      });
    } else if (status === 'cancelled') {
      if (receivable) {
        updateReceivable(receivable.id, { status: 'cancelled' });
      }
      addToast({
        type: 'info',
        title: 'Agendamento Cancelado',
        message: 'O atendimento e a respectiva cobrança no financeiro foram cancelados.',
      });
    } else if (status === 'confirmed' || status === 'pending') {
      if (receivable && receivable.status === 'cancelled') {
        updateReceivable(receivable.id, { status: 'pending' });
      }
      addToast({
        type: 'success',
        title: 'Status Atualizado',
        message: `O agendamento agora está marcado como ${statusLabels[status]}.`,
      });
    }
  };

  const handleDirectPayment = () => {
    const today = getTodayDateString();
    if (receivable) {
      markReceivablePaid(receivable.id, selectedPaymentMethod);
    } else {
      addReceivable({
        appointment_id: appointment.id,
        customer_id: appointment.customer_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        service_name: appointment.service_name,
        professional_name: appointment.professional_name,
        description: `Atendimento ${appointment.service_name}`,
        original_amount: appointment.total_price,
        discount: 0,
        surcharge: 0,
        final_amount: appointment.total_price,
        amount_paid: appointment.total_price,
        payment_method: selectedPaymentMethod,
        due_date: appointment.date,
        paid_at: today,
        status: 'paid',
        has_signal: false,
      });
    }

    addToast({
      type: 'success',
      title: 'Pagamento Confirmado! 💰',
      message: `Recebimento de ${formatCurrency(appointment.total_price)} registrado via ${selectedPaymentMethod.toUpperCase()}. Comissão de ${formatCurrency(commissionAmount)} gerada para ${appointment.professional_name}.`,
    });
  };

  const handleSendWhatsApp = (type: 'confirmation' | 'reminder' | 'details' = 'confirmation') => {
    openWhatsAppForAppointment(appointment, tenant?.name || 'Studio Prime', type);
    addToast({
      type: 'success',
      title: 'WhatsApp Aberto',
      message: `Redirecionando para envio da mensagem do agendamento para ${appointment.customer_name}...`,
    });
  };

  const handleDelete = () => {
    if (receivable) {
      deleteReceivable(receivable.id);
    }
    deleteAppointment(appointment.id);
    addToast({
      type: 'info',
      title: 'Agendamento Excluído',
      message: 'O horário e suas movimentações financeiras foram removidos.',
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title={
        <div className="flex items-center gap-2">
          <span>Detalhes do Agendamento</span>
          <Badge variant={statusVariant[appointment.status]} dot>
            {statusLabels[appointment.status]}
          </Badge>
        </div>
      }
      description={`ID: #${appointment.id.substring(0, 8)}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          {!isConfirmingDelete ? (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1.5 font-medium p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={14} /> Excluir
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-bold">Confirmar?</span>
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

          <Button variant="outline" size="sm" onClick={closeDrawer}>
            Fechar
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Customer Highlight Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/70 to-purple-50/30 dark:from-violet-950/20 dark:to-[#181424] border border-violet-100 dark:border-violet-900/30 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                Cliente
              </p>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">
                {appointment.customer_name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
                <Phone size={13} /> {formatPhone(appointment.customer_phone)}
              </p>
            </div>

            {/* Quick WhatsApp Action Button */}
            <button
              onClick={() => handleSendWhatsApp('confirmation')}
              className="p-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Abrir WhatsApp com mensagem e informações do agendamento"
            >
              <MessageCircle size={15} />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-violet-50/20 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
              <Calendar size={13} className="text-violet-500" />
              Data
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formatDate(appointment.date)}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-violet-50/20 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
              <Clock size={13} className="text-violet-500" />
              Horário
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {appointment.start_time} às {appointment.end_time}{' '}
              <span className="text-xs font-normal text-zinc-400">
                ({appointment.duration_minutes} min)
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-violet-50/20 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
              <Scissors size={13} className="text-violet-500" />
              Serviço
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {appointment.service_name}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-violet-50/20 dark:bg-[#181424] border border-violet-100/70 dark:border-violet-900/30 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase flex items-center gap-1">
              <User size={13} className="text-violet-500" />
              Profissional
            </span>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {appointment.professional_name}
            </p>
          </div>
        </div>

        {/* Financial & Commissions Integrated Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/60 to-indigo-50/30 dark:from-violet-950/20 dark:to-zinc-900 border border-violet-100/80 dark:border-violet-900/30 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={14} className="text-violet-500" />
              Financeiro & Comissões
            </span>
            <Badge
              variant={
                isPaid
                  ? 'success'
                  : receivable?.status === 'cancelled'
                  ? 'danger'
                  : 'warning'
              }
              dot
            >
              {isPaid
                ? `Pago (${(receivable?.payment_method || appointment.payment_method || 'pix').toUpperCase()})`
                : receivable?.status === 'cancelled'
                ? 'Cobrança Cancelada'
                : 'A Receber'}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-xs text-zinc-400 block font-medium">Valor Total</span>
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {formatCurrency(appointment.total_price)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block font-medium">
                Comissão {commissionRate}% ({appointment.professional_name.split(' ')[0]})
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                <Coins size={14} />
                {formatCurrency(commissionAmount)}
              </span>
            </div>
          </div>

          {/* Quick Payment Action if Pending */}
          {!isPaid && receivable?.status !== 'cancelled' ? (
            <div className="pt-2 border-t border-violet-100/70 dark:border-violet-900/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                  Forma de Recebimento:
                </span>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium focus:ring-1 focus:ring-violet-500"
                >
                  <option value="pix">Pix Instantâneo</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleDirectPayment}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Check size={14} />
                Confirmar Recebimento e Gerar Comissão
              </button>
            </div>
          ) : isPaid ? (
            <div className="pt-2 border-t border-emerald-100/70 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50/50 dark:bg-emerald-950/20 px-2.5 py-1.5 rounded-lg">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Recebido em {formatDate(receivable?.paid_at || appointment.date)}
              </span>
              <span className="font-bold">Comissão lançada</span>
            </div>
          ) : null}
        </div>

        {/* Notes */}
        {appointment.notes && (
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800 text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
              Observações:
            </span>
            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {appointment.notes}
            </p>
          </div>
        )}

        {/* Status Action Buttons Bar */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Alterar Status do Atendimento
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={appointment.status === 'confirmed' ? 'success' : 'outline'}
              onClick={() => handleStatusChange('confirmed')}
              leftIcon={<CheckCircle2 size={14} />}
            >
              Confirmar
            </Button>
            <Button
              size="sm"
              variant={appointment.status === 'completed' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange('completed')}
              leftIcon={<CheckCircle2 size={14} />}
            >
              Concluir
            </Button>
            <Button
              size="sm"
              variant={appointment.status === 'pending' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange('pending')}
            >
              Pendente
            </Button>
            <Button
              size="sm"
              variant={appointment.status === 'cancelled' ? 'danger' : 'outline'}
              onClick={() => handleStatusChange('cancelled')}
              leftIcon={<XCircle size={14} />}
            >
              Cancelar
            </Button>
          </div>
        </div>

        {/* WhatsApp Automated Actions */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
            Mensagens Prontas de WhatsApp
          </span>
          <div className="space-y-2">
            <button
              onClick={() => handleSendWhatsApp('confirmation')}
              className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                    Enviar Confirmação de Agendamento
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Mensagem com dia, horário, profissional e serviço
                  </span>
                </div>
              </div>
              <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                Enviar &rarr;
              </span>
            </button>

            <button
              onClick={() => handleSendWhatsApp('reminder')}
              className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <Clock size={15} />
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                    Enviar Lembrete de Horário
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Solicita resposta rápida (1 Confirmar / 2 Remarcar)
                  </span>
                </div>
              </div>
              <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                Enviar &rarr;
              </span>
            </button>

            <button
              onClick={() => handleSendWhatsApp('details')}
              className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all flex items-center justify-between text-xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                  <MessageCircle size={15} />
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 block">
                    Enviar Detalhes Completos com Valor
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Resumo detalhado com valor e forma de pagamento
                  </span>
                </div>
              </div>
              <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform">
                Enviar &rarr;
              </span>
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
