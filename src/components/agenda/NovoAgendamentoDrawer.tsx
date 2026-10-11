import React, { useState, useEffect } from 'react';
import { useAppointmentStore } from '../../stores/appointmentStore';
import { useCustomerStore } from '../../stores/customerStore';
import { useServiceStore } from '../../stores/serviceStore';
import { useProfessionalStore } from '../../stores/professionalStore';
import { useAuthStore } from '../../stores/authStore';
import { useFinancialStore } from '../../stores/financialStore';
import { useUIStore } from '../../stores/uiStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Calendar, Clock, User, Scissors, DollarSign, Plus, Check, MessageCircle, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { openWhatsAppForAppointment } from '../../services/whatsapp';
import { getTodayDateString } from '../../services/mockData';

export function NovoAgendamentoDrawer() {
  const { appointments, activeDrawer, closeDrawer, addAppointment } = useAppointmentStore();
  const { customers, addCustomer } = useCustomerStore();
  const { services } = useServiceStore();
  const { professionals } = useProfessionalStore();
  const { depositConfig, addReceivable } = useFinancialStore();
  const { tenant } = useAuthStore();
  const { addToast } = useUIStore();

  const isOpen = activeDrawer.type === 'new';
  const prefilled = activeDrawer.prefilledSlot;

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'unpaid'>('unpaid');
  const [sendWhatsAppOnCreate, setSendWhatsAppOnCreate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync prefilled data
  useEffect(() => {
    if (isOpen) {
      if (prefilled?.date) setDate(prefilled.date);
      else {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      }

      if (prefilled?.time) setStartTime(prefilled.time);
      if (prefilled?.professionalId) setProfessionalId(prefilled.professionalId);
      else if (professionals.length > 0) setProfessionalId(professionals[0].id);

      if (services.length > 0 && !serviceId) setServiceId(services[0].id);
      if (customers.length > 0 && !customerId) setCustomerId(customers[0].id);

      setIsCreatingCustomer(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNotes('');
    }
  }, [isOpen, prefilled, professionals, services, customers]);

  const selectedService = services.find((s) => s.id === serviceId);
  const selectedProfessional = professionals.find((p) => p.id === professionalId);

  // Calculate end time automatically based on service duration
  const calculateEndTime = (start: string, durationMinutes: number = 30) => {
    if (!start) return '09:30';
    const [hours, minutes] = start.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(startTime, selectedService?.duration_minutes || 30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalCustomerId = customerId;
    let finalCustomerName = '';
    let finalCustomerPhone = '';

    if (isCreatingCustomer) {
      if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
        addToast({
          type: 'error',
          title: 'Dados incompletos',
          message: 'Por favor preencha o nome e o WhatsApp do novo cliente.',
        });
        return;
      }
      const created = addCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        tenant_id: tenant?.id || 'tenant-default',
      });
      finalCustomerId = created.id;
      finalCustomerName = created.name;
      finalCustomerPhone = created.phone;
    } else {
      const existingCustomer = customers.find((c) => c.id === customerId);
      if (!existingCustomer) {
        addToast({
          type: 'error',
          title: 'Selecione um cliente',
          message: 'Selecione um cliente cadastrado ou cadastre um novo cliente.',
        });
        return;
      }
      finalCustomerName = existingCustomer.name;
      finalCustomerPhone = existingCustomer.phone;
    }

    if (!selectedService || !selectedProfessional) {
      addToast({
        type: 'error',
        title: 'Selecione o serviço e profissional',
        message: 'Preencha todos os campos obrigatórios.',
      });
      return;
    }

    const currentTenantId = tenant?.id || 'tenant-default';

    // 1. Validação de data passada
    const todayStr = getTodayDateString();
    if (date < todayStr) {
      addToast({
        type: 'error',
        title: 'Data Retroativa',
        message: 'Não é permitido criar agendamentos em datas anteriores a hoje.',
      });
      return;
    }

    // 2. Validação de horário de funcionamento
    const openingTime = tenant?.settings?.opening_time || '08:00';
    const closingTime = tenant?.settings?.closing_time || '20:00';
    if (startTime < openingTime || endTime > closingTime) {
      addToast({
        type: 'error',
        title: 'Fora do Expediente',
        message: `O horário ${startTime} às ${endTime} ultrapassa o expediente do estabelecimento (${openingTime} às ${closingTime}).`,
      });
      return;
    }

    // 3. Validação de dias de atendimento do profissional
    const [y, m, dNum] = date.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, dNum).getDay();
    const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    if (selectedProfessional.working_hours?.days_of_week && selectedProfessional.working_hours.days_of_week.length > 0) {
      if (!selectedProfessional.working_hours.days_of_week.includes(dayOfWeek)) {
        addToast({
          type: 'error',
          title: 'Profissional Indisponível',
          message: `${selectedProfessional.name} não realiza atendimentos aos ${dayNames[dayOfWeek]}s.`,
        });
        return;
      }
    }

    // 4. Validação de conflito de horários (Anti-Double Booking)
    const conflictingAppointment = appointments.find((apt) => {
      if (apt.status === 'cancelled') return false;
      if (apt.date !== date) return false;
      if (apt.professional_id !== selectedProfessional.id) return false;
      // Overlap: (novoInicio < fimExistente && novoFim > inicioExistente)
      return startTime < apt.end_time && endTime > apt.start_time;
    });

    if (conflictingAppointment) {
      addToast({
        type: 'error',
        title: 'Conflito de Horário! ⚠️',
        message: `${selectedProfessional.name} já possui o agendamento de "${conflictingAppointment.customer_name}" das ${conflictingAppointment.start_time} às ${conflictingAppointment.end_time}. Escolha outro horário ou profissional.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const createdApt = addAppointment({
        tenant_id: currentTenantId,
        customer_id: finalCustomerId,
        customer_name: finalCustomerName,
        customer_phone: finalCustomerPhone,
        service_id: selectedService.id,
        service_name: selectedService.name,
        service_price: selectedService.price,
        professional_id: selectedProfessional.id,
        professional_name: selectedProfessional.name,
        date,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: selectedService.duration_minutes,
        status: 'confirmed',
        notes,
        payment_method: paymentMethod,
        total_price: selectedService.price,
      });

      // Integração com Contas a Receber no Módulo Financeiro
      try {
        const hasSignal = depositConfig.enabled;
        const signalVal = hasSignal
          ? depositConfig.type === 'percentage'
            ? Math.round((selectedService.price * depositConfig.value) / 100)
            : Math.min(selectedService.price, depositConfig.value)
          : 0;

        addReceivable({
          appointment_id: createdApt.id,
          customer_id: finalCustomerId,
          customer_name: finalCustomerName,
          customer_phone: finalCustomerPhone,
          service_name: selectedService.name,
          professional_name: selectedProfessional.name,
          description: `Atendimento ${selectedService.name}`,
          original_amount: selectedService.price,
          discount: 0,
          surcharge: 0,
          final_amount: selectedService.price,
          amount_paid:
            paymentMethod !== 'unpaid'
              ? selectedService.price
              : hasSignal
              ? signalVal
              : 0,
          payment_method: paymentMethod === 'unpaid' ? 'pix' : (paymentMethod as any),
          due_date: date,
          paid_at: paymentMethod !== 'unpaid' ? date : undefined,
          status:
            paymentMethod !== 'unpaid'
              ? 'paid'
              : hasSignal
              ? 'partially_paid'
              : 'pending',
          has_signal: hasSignal,
          signal_amount: hasSignal ? signalVal : undefined,
          signal_paid: hasSignal,
          notes: notes || undefined,
        });
      } catch (errRec) {
        console.error('Erro ao integrar com financeiro:', errRec);
      }

      if (sendWhatsAppOnCreate && createdApt) {
        openWhatsAppForAppointment(
          createdApt,
          tenant?.name || 'Studio Prime',
          'confirmation'
        );
      }

      addToast({
        type: 'success',
        title: 'Agendamento Criado!',
        message: sendWhatsAppOnCreate
          ? `Agendamento criado! Redirecionando para o WhatsApp de ${finalCustomerName}...`
          : `Horário marcado para ${finalCustomerName} às ${startTime}.`,
      });

      closeDrawer();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erro ao agendar',
        message: 'Ocorreu um erro ao salvar o agendamento.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDrawer}
      title="Novo Agendamento"
      description="Preencha os detalhes para reservar um horário na agenda"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="ghost" onClick={closeDrawer} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={<Check size={16} />}
          >
            Confirmar Agendamento
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Selection Section */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <User size={14} className="text-violet-500" />
              Cliente
            </span>
            <button
              type="button"
              onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              {isCreatingCustomer ? 'Selecionar existente' : '+ Cadastrar novo'}
            </button>
          </div>

          {isCreatingCustomer ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Nome do Cliente"
                placeholder="Ex: Mariana Silva"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                required
              />
              <Input
                label="WhatsApp / Celular"
                placeholder="(11) 99999-9999"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                required
              />
            </div>
          ) : (
            <Select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} — ${c.phone}`,
              }))}
            />
          )}
        </div>

        {/* Service Selection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors size={14} className="text-violet-500" />
              Serviço
            </label>
            {selectedService && (
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                {formatCurrency(selectedService.price)} • {selectedService.duration_minutes} min
              </span>
            )}
          </div>
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            options={services
              .filter((s) => s.is_active)
              .map((s) => ({
                value: s.id,
                label: `${s.name} (${s.duration_minutes}m) — ${formatCurrency(s.price)}`,
              }))}
          />
        </div>

        {/* Professional Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} className="text-violet-500" />
            Profissional Responsável
          </label>
          <Select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            options={professionals
              .filter((p) => p.is_active)
              .map((p) => ({
                value: p.id,
                label: `${p.name} — ${p.role}`,
              }))}
          />
        </div>

        {/* Date and Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftIcon={<Calendar size={15} />}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Horário Início
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                required
              />
              <span className="text-xs text-zinc-400 font-medium">até</span>
              <div className="px-3 py-2.5 rounded-xl bg-violet-50/60 dark:bg-zinc-800/60 border border-violet-100 dark:border-zinc-700 text-xs font-bold text-violet-700 dark:text-zinc-300 shrink-0">
                {endTime}
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Price Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Forma de Pagamento"
            value={paymentMethod}
            onChange={(e: any) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'unpaid', label: 'Pendente / No Local' },
              { value: 'pix', label: 'PIX Antecipado' },
              { value: 'credit_card', label: 'Cartão de Crédito' },
              { value: 'debit_card', label: 'Cartão de Débito' },
              { value: 'cash', label: 'Dinheiro' },
            ]}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
              Valor Total
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20 text-sm font-extrabold text-violet-700 dark:text-violet-300">
              {formatCurrency(selectedService?.price || 0)}
            </div>
            {depositConfig.enabled && selectedService && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} />
                Sinal de reserva:{' '}
                {formatCurrency(
                  depositConfig.type === 'percentage'
                    ? (selectedService.price * depositConfig.value) / 100
                    : Math.min(selectedService.price, depositConfig.value)
                )}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            Observações / Recomendações
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ex: Cliente prefere atendimento pontual, alergia a produtos..."
            className="w-full rounded-xl bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
          />
        </div>

        {/* WhatsApp Notification Option */}
        <div className="pt-1">
          <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-200/90 dark:border-emerald-800/50 cursor-pointer select-none transition-all hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40">
            <input
              type="checkbox"
              checked={sendWhatsAppOnCreate}
              onChange={(e) => setSendWhatsAppOnCreate(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300 dark:border-emerald-700 accent-emerald-600 cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                <MessageCircle size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                Redirecionar para WhatsApp ao confirmar
              </span>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400">
                Abre o WhatsApp com a mensagem personalizada contendo data, horário, serviço e valores.
              </p>
            </div>
          </label>
        </div>
      </form>
    </Drawer>
  );
}
