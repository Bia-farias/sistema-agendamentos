import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  MapPin,
  Coins,
  Copy,
  Check,
  MessageCircle,
  AlertCircle,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useServiceStore } from '../stores/serviceStore';
import { useProfessionalStore } from '../stores/professionalStore';
import { useAppointmentStore } from '../stores/appointmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { useFinancialStore } from '../stores/financialStore';
import { useUIStore } from '../stores/uiStore';
import { Service, Professional, Appointment } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { maskPhone } from '../utils/masks';
import { getTodayDateString } from '../services/mockData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export default function AgendamentoCliente() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const { tenant } = useAuthStore();
  const { services } = useServiceStore();
  const { professionals } = useProfessionalStore();
  const { appointments, addAppointment } = useAppointmentStore();
  const { customers, addCustomer } = useCustomerStore();
  const { depositConfig, addReceivable } = useFinancialStore();
  const { addToast } = useUIStore();

  // Multi-step state: 1: Serviço | 2: Profissional | 3: Data & Hora | 4: Dados | 5: Sucesso
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Selection state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isAnyProfessional, setIsAnyProfessional] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [searchService, setSearchService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Estabelecimento info
  const establishmentName = tenant?.name || 'Meu Estabelecimento';
  const establishmentPhone = tenant?.phone || '';
  const establishmentAddress = tenant?.address || '';
  const allowBooking = tenant?.settings?.allow_online_booking ?? true;

  // Filtragem de serviços ativos
  const activeServices = useMemo(() => {
    return services
      .filter((s) => s.is_active !== false)
      .filter((s) =>
        searchService
          ? s.name.toLowerCase().includes(searchService.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchService.toLowerCase())
          : true
      );
  }, [services, searchService]);

  // Profissionais ativos e aptos ao serviço
  const eligibleProfessionals = useMemo(() => {
    return professionals.filter((p) => p.is_active !== false);
  }, [professionals]);

  // Próximos 14 dias para agendamento
  const availableDates = useMemo(() => {
    const list: { dateString: string; dayNumber: number; weekDay: string; monthName: string }[] = [];
    const today = new Date();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      list.push({
        dateString,
        dayNumber: d.getDate(),
        weekDay: weekDays[d.getDay()],
        monthName: months[d.getMonth()],
      });
    }
    return list;
  }, []);

  // Horários disponíveis para a data e profissional selecionados
  const availableSlots = useMemo(() => {
    if (!selectedService) return [];

    const opening = tenant?.settings?.opening_time || '08:00';
    const closing = tenant?.settings?.closing_time || '20:00';
    const interval = tenant?.settings?.interval_minutes || 30;

    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const duration = selectedService.duration_minutes || 30;

    const slots: { start: string; end: string; available: boolean }[] = [];

    // Checa dia de trabalho do profissional
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, dNum).getDay();

    if (
      selectedProfessional &&
      selectedProfessional.working_hours?.days_of_week &&
      !selectedProfessional.working_hours.days_of_week.includes(dayOfWeek)
    ) {
      return []; // Profissional de folga
    }

    const todayStr = getTodayDateString();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let current = openMinutes; current + duration <= closeMinutes; current += interval) {
      const startH = Math.floor(current / 60);
      const startM = current % 60;
      const endTotal = current + duration;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;

      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Se for hoje, bloqueia horários já passados
      const isPast = selectedDate === todayStr && current <= currentMinutes;

      // Anti-colisão: verifica se já há agendamento para o profissional
      let hasConflict = false;
      if (selectedProfessional) {
        hasConflict = appointments.some((apt) => {
          if (apt.status === 'cancelled') return false;
          if (apt.date !== selectedDate) return false;
          if (apt.professional_id !== selectedProfessional.id) return false;
          return startTime < apt.end_time && endTime > apt.start_time;
        });
      }

      slots.push({
        start: startTime,
        end: endTime,
        available: !isPast && !hasConflict,
      });
    }

    return slots;
  }, [selectedService, selectedProfessional, selectedDate, tenant, appointments]);

  // Cálculo do sinal
  const depositAmount = useMemo(() => {
    if (!depositConfig.enabled || !selectedService) return 0;
    if (depositConfig.type === 'percentage') {
      return Math.round((selectedService.price * depositConfig.value) / 100);
    }
    return Math.min(selectedService.price, depositConfig.value);
  }, [depositConfig, selectedService]);

  const handleCopyPix = () => {
    const key = depositConfig.pix_key || '12.345.678/0001-90';
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    addToast({
      type: 'success',
      title: 'Chave Pix Copiada!',
      message: 'Cole no seu aplicativo de banco para efetuar o pagamento do sinal.',
    });
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleConfirmAppointment = () => {
    if (!selectedService || !selectedTimeSlot) return;

    // Se selecionou "qualquer profissional", escolhe o primeiro disponível
    const profToUse =
      selectedProfessional ||
      eligibleProfessionals[0] || {
        id: 'prof-default',
        name: 'Equipe ' + establishmentName,
        tenant_id: tenant?.id || 'tenant-1001',
        role: 'professional',
        specialties: [],
        commission_percentage: 35,
        is_active: true,
      };

    if (!customerName.trim() || !customerPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Dados Incompletos',
        message: 'Por favor, informe seu nome e telefone para contato.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const slot = availableSlots.find((s) => s.start === selectedTimeSlot);
      const endTime = slot ? slot.end : selectedTimeSlot;

      // 1. Cadastra ou localiza cliente
      const cleanPhone = customerPhone.replace(/\D/g, '');
      let customerId = `cust-${Date.now()}`;
      const existingCustomer = customers.find(
        (c) => c.phone.replace(/\D/g, '') === cleanPhone
      );

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const createdCustomer = addCustomer({
          tenant_id: tenant?.id || 'tenant-1001',
          name: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || undefined,
        });
        customerId = createdCustomer.id;
      }

      // 2. Cria agendamento
      const hasSignal = depositConfig.enabled && depositAmount > 0;
      const apt = addAppointment({
        tenant_id: tenant?.id || 'tenant-1001',
        customer_id: customerId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        service_id: selectedService.id,
        service_name: selectedService.name,
        service_price: selectedService.price,
        professional_id: profToUse.id,
        professional_name: profToUse.name,
        date: selectedDate,
        start_time: selectedTimeSlot,
        end_time: endTime,
        duration_minutes: selectedService.duration_minutes,
        status: hasSignal ? 'pending' : 'confirmed',
        notes: notes.trim() ? `[Auto-Agendamento Online] ${notes.trim()}` : '[Auto-Agendamento Online]',
        payment_method: hasSignal ? 'unpaid' : 'pix',
        total_price: selectedService.price,
      });

      // 3. Registra cobrança no Financeiro
      addReceivable({
        appointment_id: apt.id,
        customer_id: customerId,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        service_name: selectedService.name,
        professional_name: profToUse.name,
        description: `Agendamento Online - ${selectedService.name}`,
        original_amount: selectedService.price,
        discount: 0,
        surcharge: 0,
        final_amount: selectedService.price,
        amount_paid: 0,
        payment_method: 'pix',
        due_date: selectedDate,
        status: 'pending',
        has_signal: hasSignal,
      });

      setCreatedAppointment(apt);
      setStep(5);
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Erro ao Confirmar',
        message: 'Ocorreu um erro ao processar o agendamento. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEstablishmentWhatsApp = () => {
    if (!createdAppointment) return;

    const cleanPhone = establishmentPhone.replace(/\D/g, '');
    let msg = `Olá! Acabei de realizar um agendamento online no *${establishmentName}*! 👋\n\n`;
    msg += `📋 *Comprovante de Reserva:*\n`;
    msg += `• *Cliente:* ${createdAppointment.customer_name}\n`;
    msg += `• *Serviço:* ${createdAppointment.service_name}\n`;
    msg += `• *Data:* ${formatDate(createdAppointment.date)}\n`;
    msg += `• *Horário:* ${createdAppointment.start_time} às ${createdAppointment.end_time}\n`;
    msg += `• *Profissional:* ${createdAppointment.professional_name}\n`;
    msg += `• *Valor:* ${formatCurrency(createdAppointment.total_price)}\n`;

    if (depositConfig.enabled && depositAmount > 0) {
      msg += `\nEstou enviando o comprovante do sinal de *${formatCurrency(depositAmount)}* via Pix. ✅`;
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Se agendamento online estiver desativado pelo gestor
  if (!allowBooking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white dark:from-[#09090b] dark:to-[#13101e] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-violet-100 dark:border-zinc-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
            ⏳
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            Agendamentos Online Pausados
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            O <strong>{establishmentName}</strong> está recebendo agendamentos diretamente pelo canal de atendimento do WhatsApp.
          </p>
          <a
            href={`https://wa.me/55${establishmentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
              `Olá! Gostaria de consultar os horários disponíveis para agendamento no ${establishmentName}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
          >
            <MessageCircle size={16} /> Falar no WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#13101e]/90 backdrop-blur-md border-b border-violet-100/70 dark:border-violet-900/20 py-3 px-4 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-violet-500/20">
              {establishmentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                {establishmentName}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <MapPin size={11} className="text-violet-500 shrink-0" />
                <span className="truncate max-w-[200px]">{establishmentAddress}</span>
              </p>
            </div>
          </div>

          <Badge variant="success" dot className="text-[10px]">
            Aberto
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-6">
        {/* Step Indicator (1 to 4) */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-2">
              <span className={step >= 1 ? 'text-violet-600 dark:text-violet-400' : ''}>1. Serviço</span>
              <span className={step >= 2 ? 'text-violet-600 dark:text-violet-400' : ''}>2. Profissional</span>
              <span className={step >= 3 ? 'text-violet-600 dark:text-violet-400' : ''}>3. Horário</span>
              <span className={step >= 4 ? 'text-violet-600 dark:text-violet-400' : ''}>4. Confirmar</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── PASSO 1: SELEÇÃO DE SERVIÇO ─── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Escolha o Serviço
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecione o procedimento que deseja agendar.
              </p>
            </div>

            <div className="relative">
              <Input
                placeholder="Buscar serviço..."
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                className="pl-3 py-2 text-xs"
              />
            </div>

            {activeServices.length === 0 ? (
              <div className="text-center py-10 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <Scissors size={28} className="mx-auto text-zinc-300" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Nenhum serviço encontrado
                </p>
                <p className="text-[11px] text-zinc-400">
                  Tente buscar por outro termo ou contate o estabelecimento.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                          : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#13101e] hover:border-violet-300'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                            {service.name}
                          </span>
                          {service.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold">
                              {service.category}
                            </span>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Clock size={12} className="text-violet-500" />
                          {service.duration_minutes} min
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-violet-600 dark:text-violet-400 block">
                          {formatCurrency(service.price)}
                        </span>
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center mt-1 ml-auto transition-colors ${
                            isSelected
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedService && (
              <div className="sticky bottom-4 pt-2">
                <Button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.01]"
                  rightIcon={<ChevronRight size={16} />}
                >
                  Continuar com {selectedService.name}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── PASSO 2: SELEÇÃO DE PROFISSIONAL ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ChevronLeft size={14} /> Voltar para serviços
            </button>

            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Escolha o Profissional
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecione quem irá realizar seu atendimento.
              </p>
            </div>

            {/* Opção: Qualquer Profissional Disponível */}
            <div
              onClick={() => {
                setIsAnyProfessional(true);
                setSelectedProfessional(null);
                setStep(3);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                isAnyProfessional
                  ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#13101e] hover:border-violet-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  ⚡
                </div>
                <div>
                  <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block">
                    Qualquer Profissional Disponível
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Maior variedade de horários livres
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-400" />
            </div>

            {/* Lista de Profissionais */}
            <div className="space-y-2.5">
              {eligibleProfessionals.map((prof) => {
                const isSelected = selectedProfessional?.id === prof.id && !isAnyProfessional;
                return (
                  <div
                    key={prof.id}
                    onClick={() => {
                      setSelectedProfessional(prof);
                      setIsAnyProfessional(false);
                      setStep(3);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#13101e] hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl text-white font-black flex items-center justify-center text-xs shadow-sm"
                        style={{ backgroundColor: prof.color || '#6366f1' }}
                      >
                        {prof.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 block">
                          {prof.name}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {prof.specialties?.join(', ') || prof.role || 'Especialista'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── PASSO 3: DATA & HORÁRIO ─── */}
        {step === 3 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ChevronLeft size={14} /> Voltar para profissional
            </button>

            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Selecione a Data e Horário
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Escolha o dia ideal e um dos horários livres.
              </p>
            </div>

            {/* Carrossel de Datas */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {availableDates.map((item) => {
                const isSelected = selectedDate === item.dateString;
                return (
                  <button
                    key={item.dateString}
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.dateString);
                      setSelectedTimeSlot(null);
                    }}
                    className={`p-3 rounded-2xl min-w-[70px] text-center transition-all cursor-pointer flex flex-col items-center gap-1 border shrink-0 ${
                      isSelected
                        ? 'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#13101e] text-zinc-600 dark:text-zinc-400 hover:border-violet-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {item.weekDay}
                    </span>
                    <span className="text-base font-black">{item.dayNumber}</span>
                    <span className="text-[10px] opacity-80">{item.monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Grade de Horários */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                Horários Disponíveis ({formatDate(selectedDate)}):
              </span>

              {availableSlots.length === 0 ? (
                <div className="text-center py-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <Clock size={24} className="mx-auto text-zinc-400 mb-1" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Sem horários disponíveis nesta data
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    O profissional está de folga ou a agenda do dia está lotada. Escolha outra data acima.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTimeSlot(slot.start)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5 border ${
                          !slot.available
                            ? 'bg-zinc-100 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/50 text-zinc-400 cursor-not-allowed opacity-40 line-through'
                            : isSelected
                            ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                            : 'bg-white dark:bg-[#13101e] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-violet-400 cursor-pointer'
                        }`}
                      >
                        <span>{slot.start}</span>
                        <span className="text-[9px] font-normal opacity-80">até {slot.end}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedTimeSlot && (
              <div className="sticky bottom-4 pt-2">
                <Button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-xl shadow-violet-500/25 transition-all hover:scale-[1.01]"
                  rightIcon={<ChevronRight size={16} />}
                >
                  Continuar com {selectedTimeSlot}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── PASSO 4: IDENTIFICAÇÃO E RESUMO ─── */}
        {step === 4 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(3)}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ChevronLeft size={14} /> Voltar para horários
            </button>

            <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Seus Dados e Confirmação
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Informe como entrar em contato para confirmar sua reserva.
              </p>
            </div>

            {/* Resumo do Atendimento */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-100">
                  Resumo da Reserva
                </span>
                <span className="text-sm font-black text-white">
                  {formatCurrency(selectedService?.price || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-violet-100">
                <div>
                  <span className="block text-[10px] text-violet-200 uppercase">Serviço</span>
                  <span className="font-bold text-white">{selectedService?.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-violet-200 uppercase">Profissional</span>
                  <span className="font-bold text-white">
                    {selectedProfessional?.name || 'Equipe ' + establishmentName}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-violet-200 uppercase">Data</span>
                  <span className="font-bold text-white">{formatDate(selectedDate)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-violet-200 uppercase">Horário</span>
                  <span className="font-bold text-white">{selectedTimeSlot}</span>
                </div>
              </div>
            </div>

            {/* Formulário de Identificação */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#13101e] border border-zinc-200/80 dark:border-zinc-800 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Seu Nome Completo *
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Souza"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Seu WhatsApp / Telefone *
                </label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                  placeholder="Ex: (11) 98765-4321"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  E-mail (Opcional)
                </label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Ex: mariana@email.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Observações ou Preferências (Opcional)
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: primeira vez, cabelo longo, alergias..."
                />
              </div>
            </div>

            {/* Card de Sinal / Pix (Se ativo) */}
            {depositConfig.enabled && depositAmount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-amber-600" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Sinal de Garantia via Pix: {formatCurrency(depositAmount)}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  {depositConfig.instructions}
                </p>

                <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-amber-200/60 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block font-semibold uppercase">
                      Chave Pix ({depositConfig.pix_key_type?.toUpperCase() || 'CHAVE'})
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                      {depositConfig.pix_key || '12.345.678/0001-90'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="p-2 px-3 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                    {copiedPix ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}

            <div className="sticky bottom-4 pt-2">
              <Button
                onClick={handleConfirmAppointment}
                disabled={isSubmitting || !customerName.trim() || !customerPhone.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all hover:scale-[1.01]"
                leftIcon={<CheckCircle2 size={18} />}
              >
                {isSubmitting ? 'Confirmando Agendamento...' : 'Concluir Meu Agendamento'}
              </Button>
            </div>
          </div>
        )}

        {/* ─── PASSO 5: TELA DE SUCESSO WOW ─── */}
        {step === 5 && createdAppointment && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#13101e] border border-violet-100 dark:border-violet-900/30 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
              <CheckCircle2 size={42} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Reserva Registrada com Sucesso!
              </span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Te esperamos, {createdAppointment.customer_name.split(' ')[0]}!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Seu horário está reservado no <strong>{establishmentName}</strong>.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-zinc-400">Protocolo</span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  #{createdAppointment.id.substring(4, 12).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Serviço</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {createdAppointment.service_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Profissional</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {createdAppointment.professional_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Data e Hora</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatDate(createdAppointment.date)} às {createdAppointment.start_time}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400">Valor Total</span>
                <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(createdAppointment.total_price)}
                </span>
              </div>
            </div>

            {/* Ações pós confirmação */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleOpenEstablishmentWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <MessageCircle size={16} /> Enviar Comprovante no WhatsApp do Estabelecimento
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedProfessional(null);
                  setSelectedTimeSlot(null);
                  setCreatedAppointment(null);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Fazer Outro Agendamento
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
