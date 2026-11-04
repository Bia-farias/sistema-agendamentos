import React, { useState, useEffect, useMemo } from 'react';
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
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  Image as ImageIcon,
  Star,
  Check,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import {
  publicScheduleService,
  PublicSalonData,
  PublicBusySlotsResponse,
} from '../services/api/publicScheduleService';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { formatCurrency, formatDate } from '../utils/format';
import { maskPhone } from '../utils/masks';
import { getTodayDateString, initialTenant } from '../services/mockData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function AgendamentoCliente() {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { tenant } = useAuthStore();
  const { addToast } = useUIStore();

  // Determina o slug alvo (da URL ou do tenant autenticado como preview)
  const targetSlug = routeSlug || tenant?.slug || 'studio-prime';

  const [salon, setSalon] = useState<PublicSalonData | null>(null);
  const [isLoadingSalon, setIsLoadingSalon] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fluxo de passos:
  // 1: Profissional -> 2: Serviço -> 3: Data & Horário -> 4: Dados do Cliente -> 5: Confirmação
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Estados de Seleção
  const [selectedProfessional, setSelectedProfessional] = useState<PublicSalonData['professionals'][0] | null>(null);
  const [isAnyProfessional, setIsAnyProfessional] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicSalonData['services'][0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  // Dados do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Estados auxiliares
  const [searchService, setSearchService] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Modal de Portfólio do Profissional
  const [portfolioModalProf, setPortfolioModalProf] = useState<PublicSalonData['professionals'][0] | null>(null);

  // Carrossel de fotos do ambiente
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Slots ocupados da API
  const [busySlots, setBusySlots] = useState<PublicBusySlotsResponse['busySlots']>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Carregar dados da empresa
  useEffect(() => {
    async function loadSalon() {
      setIsLoadingSalon(true);
      setLoadError(null);
      try {
        const data = await publicScheduleService.getSalon(targetSlug);
        setSalon(data);
      } catch (err: any) {
        console.warn('Erro ao carregar dados do salão:', err);
        // Fallback elegante se a API estiver em mock ou offline
        const fallback = tenant || initialTenant;
        setSalon({
          id: fallback.id,
          name: fallback.name,
          slug: fallback.slug,
          businessType: fallback.business_type,
          phone: fallback.phone || '(11) 98888-7777',
          email: fallback.email,
          address: fallback.address || 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
          logoUrl: fallback.logo_url,
          coverUrl: fallback.cover_url,
          galleryUrls: fallback.gallery_urls || [],
          description: fallback.description || 'Bem-vindo ao nosso espaço de beleza e bem-estar. Escolha seu especialista e agende com comodidade.',
          whatsapp: fallback.whatsapp || fallback.phone,
          instagram: fallback.instagram || '@studioprime',
          facebook: fallback.facebook,
          primaryColor: fallback.primary_color || '#7c3aed',
          openingTime: fallback.settings?.opening_time || '08:00',
          closingTime: fallback.settings?.closing_time || '20:00',
          intervalMinutes: fallback.settings?.interval_minutes || 30,
          allowOnlineBooking: fallback.settings?.allow_online_booking ?? true,
          services: [
            { id: 'srv-1', name: 'Corte Feminino & Escova', category: 'Cabelo', price: 140, durationMinutes: 60, color: '#8b5cf6', description: 'Lavagem especial, corte estilizado e escova modeladora.' },
            { id: 'srv-2', name: 'Corte Degradê Masculino', category: 'Barbearia', price: 80, durationMinutes: 45, color: '#06b6d4', description: 'Fade na navalha com acabamento e alinhamento de fios.' },
            { id: 'srv-3', name: 'Mechas Criativas / Balayage', category: 'Cabelo', price: 480, durationMinutes: 180, color: '#ec4899', description: 'Técnica personalizada de iluminação com proteção Plex.' },
            { id: 'srv-4', name: 'Alongamento em Gel (Unhas)', category: 'Unhas', price: 220, durationMinutes: 120, color: '#f59e0b', description: 'Alongamento em fibra de vidro com cutilagem e esmaltação em gel.' },
            { id: 'srv-5', name: 'Limpeza de Pele Profunda', category: 'Estética', price: 180, durationMinutes: 90, color: '#10b981', description: 'Higienização, vapor de ozônio, extração de cravos e máscara LED.' },
          ],
          professionals: [
            {
              id: 'pro-1',
              name: 'Camila Albuquerque',
              role: 'Master Stylist & Visagista',
              specialties: ['Corte Feminino', 'Mechas', 'Colorimetria'],
              avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
              color: '#ec4899',
              bio: 'Mais de 10 anos de experiência com cortes modernos e mechas personalizadas. Apaixonada por realçar sua melhor versão.',
              portfolioUrls: [
                'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
              ],
              workingHoursStart: '09:00',
              workingHoursEnd: '19:00',
              workingDays: [1, 2, 3, 4, 5, 6],
            },
            {
              id: 'pro-2',
              name: 'Lucas Ferreira',
              role: 'Barbeiro Visagista & Terapeuta Capilar',
              specialties: ['Barba', 'Corte Degradê', 'Terapia Capilar'],
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              color: '#06b6d4',
              bio: 'Especialista em cortes masculinos clássicos e visagismo. Experiência em barboterapia e tratamentos de couro cabeludo.',
              portfolioUrls: [
                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
              ],
              workingHoursStart: '09:00',
              workingHoursEnd: '19:00',
              workingDays: [1, 2, 3, 4, 5, 6],
            },
            {
              id: 'pro-3',
              name: 'Beatriz Lima',
              role: 'Nail Designer & Podóloga',
              specialties: ['Alongamento Gel', 'Esmaltação em Gel', 'Podologia'],
              avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
              color: '#f59e0b',
              bio: 'Cuidado e perfeccionismo para a saúde e beleza das suas unhas. Técnicas avançadas de biossegurança.',
              portfolioUrls: [
                'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=600&auto=format&fit=crop&q=80',
              ],
              workingHoursStart: '09:00',
              workingHoursEnd: '19:00',
              workingDays: [1, 2, 3, 4, 5, 6],
            },
          ],
        });
      } finally {
        setIsLoadingSalon(false);
      }
    }

    loadSalon();
  }, [targetSlug, tenant]);

  // Carregar slots ocupados quando mudar data ou profissional
  useEffect(() => {
    if (!salon || !selectedDate) return;

    async function fetchSlots() {
      setIsLoadingSlots(true);
      try {
        const profId = isAnyProfessional ? undefined : selectedProfessional?.id;
        const res = await publicScheduleService.getBusySlots(salon!.slug, selectedDate, profId);
        setBusySlots(res.busySlots || []);
      } catch (err) {
        console.warn('Erro ao consultar horários ocupados:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [salon, selectedDate, selectedProfessional, isAnyProfessional]);

  // Cores dinâmicas do tema
  const themeColor = salon?.primaryColor || '#7c3aed';

  // Categorias de serviços
  const categories = useMemo(() => {
    if (!salon?.services) return [];
    const set = new Set(salon.services.map((s) => s.category));
    return ['todos', ...Array.from(set)];
  }, [salon?.services]);

  // Serviços filtrados
  const filteredServices = useMemo(() => {
    if (!salon?.services) return [];
    return salon.services.filter((s) => {
      const matchesSearch =
        searchService === '' ||
        s.name.toLowerCase().includes(searchService.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchService.toLowerCase());
      const matchesCategory = selectedCategory === 'todos' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [salon?.services, searchService, selectedCategory]);

  // Próximos 14 dias para o calendário
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

  // Horários disponíveis com anti-colisão e intervalo de almoço
  const availableSlots = useMemo(() => {
    if (!selectedService || !salon) return [];

    const opening = salon.openingTime || '08:00';
    const closing = salon.closingTime || '20:00';
    const interval = salon.intervalMinutes || 30;

    const [openH, openM] = opening.split(':').map(Number);
    const [closeH, closeM] = closing.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const duration = selectedService.durationMinutes || 30;

    const slots: { start: string; end: string; available: boolean }[] = [];

    // Checa dia de trabalho do profissional
    const [y, m, dNum] = selectedDate.split('-').map(Number);
    const dayOfWeek = new Date(y, m - 1, dNum).getDay();

    if (
      selectedProfessional &&
      !isAnyProfessional &&
      selectedProfessional.workingDays &&
      !selectedProfessional.workingDays.includes(dayOfWeek)
    ) {
      return []; // Profissional de folga neste dia
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

      // Se for hoje e o horário já passou, fica indisponível
      const isPast = selectedDate === todayStr && current <= currentMinutes;

      // Verifica colisão com agendamentos existentes ou intervalo de almoço
      const hasCollision = busySlots.some((slot) => {
        return startTime < slot.endTime && endTime > slot.startTime;
      });

      slots.push({
        start: startTime,
        end: endTime,
        available: !isPast && !hasCollision,
      });
    }

    return slots;
  }, [selectedService, salon, selectedDate, selectedProfessional, isAnyProfessional, busySlots]);

  // Confirmar Agendamento
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      addToast({
        type: 'error',
        title: 'Dados Incompletos',
        message: 'Por favor, informe seu nome e telefone para contato.',
      });
      return;
    }

    if (!selectedService || !selectedTimeSlot || !salon) return;

    // Se escolheu qualquer profissional, seleciona o primeiro disponível
    const profToBook = isAnyProfessional
      ? salon.professionals[0]
      : selectedProfessional || salon.professionals[0];

    setIsSubmitting(true);

    try {
      const booking = await publicScheduleService.bookAppointment(salon.slug, {
        serviceId: selectedService.id,
        professionalId: profToBook.id,
        date: selectedDate,
        startTime: selectedTimeSlot,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setConfirmedBooking(booking);
      setStep(5);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Horário Indisponível',
        message: err.message || 'Este horário acabou de ser reservado. Por favor, escolha outro slot.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSalon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9ff] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 p-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-zinc-500">Carregando página do estabelecimento...</p>
      </div>
    );
  }

  if (loadError || !salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9ff] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-900/50">
          <Building2 size={32} />
        </div>
        <h1 className="text-xl font-black">Estabelecimento Não Encontrado</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-2">
          O link que você acessou não corresponde a nenhum salão, barbearia ou clínica cadastrada no Agenda AI.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all"
        >
          Ir para a Página Inicial
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9ff] dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 antialiased selection:bg-violet-500 selection:text-white pb-24">
      {/* 1. HERO & BANNER DE APRESENTAÇÃO DO ESTABELECIMENTO */}
      <div className="relative">
        {/* Banner de Capa */}
        <div
          className="h-44 sm:h-64 w-full bg-cover bg-center relative"
          style={{
            backgroundImage: salon.coverUrl
              ? `url("${salon.coverUrl}")`
              : `linear-gradient(135deg, ${themeColor}, #312e81)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
        </div>

        {/* Info Box Flutuante do Estabelecimento */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-16 sm:-mt-20">
          <div className="bg-white dark:bg-[#121216] rounded-3xl p-5 sm:p-7 shadow-xl border border-zinc-200/80 dark:border-zinc-800 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Logo da Empresa */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-zinc-800 p-1 shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
                  {salon.logoUrl ? (
                    <img
                      src={salon.logoUrl}
                      alt={salon.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner"
                      style={{ backgroundColor: themeColor }}
                    >
                      {salon.name.substring(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                      {salon.name}
                    </h1>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Agendamento Online Ativo" />
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                    <MapPin size={13} className="text-rose-500 shrink-0" />
                    <span>{salon.address || 'Endereço disponível no atendimento'}</span>
                  </p>
                </div>
              </div>

              {/* Contato & Redes Sociais */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                {salon.whatsapp && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=${salon.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-transform border border-emerald-200/60 dark:border-emerald-800/40"
                    title="Conversar no WhatsApp"
                  >
                    <MessageCircle size={17} />
                  </a>
                )}

                {salon.instagram && (
                  <a
                    href={salon.instagram.startsWith('http') ? salon.instagram : `https://instagram.com/${salon.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 hover:scale-105 transition-transform border border-pink-200/60 dark:border-pink-800/40"
                    title="Ver Instagram"
                  >
                    <Instagram size={17} />
                  </a>
                )}

                {salon.phone && (
                  <a
                    href={`tel:${salon.phone.replace(/\D/g, '')}`}
                    className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:scale-105 transition-transform"
                    title="Ligar"
                  >
                    <Phone size={17} />
                  </a>
                )}
              </div>
            </div>

            {/* Descrição Sobre Nós */}
            {salon.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 leading-relaxed">
                {salon.description}
              </p>
            )}

            {/* Carrossel de Fotos do Ambiente se existirem */}
            {salon.galleryUrls && salon.galleryUrls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-2.5">
                  <ImageIcon size={13} />
                  Conheça Nosso Espaço
                </span>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {salon.galleryUrls.map((url, i) => (
                    <div
                      key={i}
                      className="w-40 sm:w-48 h-24 sm:h-28 rounded-2xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                    >
                      <img
                        src={url}
                        alt={`Ambiente ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL DE AGENDAMENTO (WIZARD EM PASSOS) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        {/* Barra de Progresso dos Passos */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Passo {step} de 4
              </span>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {step === 1 && 'Escolha o Profissional'}
                {step === 2 && 'Escolha o Serviço'}
                {step === 3 && 'Escolha Data & Horário'}
                {step === 4 && 'Seus Dados para Contato'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(step / 4) * 100}%`,
                  backgroundColor: themeColor,
                }}
              />
            </div>
          </div>
        )}

        {/* PASSO 1: ESCOLHER PROFISSIONAL */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                Com quem você gostaria de ser atendido?
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Selecione seu profissional favorito ou escolha "Qualquer Profissional" para ver os horários mais rápidos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Opção Qualquer Profissional */}
              <button
                type="button"
                onClick={() => {
                  setSelectedProfessional(null);
                  setIsAnyProfessional(true);
                  setStep(2);
                }}
                className={`p-5 rounded-3xl border text-left transition-all hover:scale-[1.02] cursor-pointer relative ${
                  isAnyProfessional
                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-md ring-2 ring-violet-500'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] hover:border-zinc-300'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 text-white flex items-center justify-center font-bold shadow-md mb-3">
                  <Sparkles size={24} />
                </div>
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                  Qualquer Especialista
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Encontraremos o horário mais próximo disponível entre nossa equipe.
                </p>
              </button>

              {/* Cards Individuais dos Profissionais */}
              {salon.professionals.map((prof) => (
                <div
                  key={prof.id}
                  className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                    selectedProfessional?.id === prof.id && !isAnyProfessional
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-md ring-2 ring-violet-500'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-700">
                        {prof.avatarUrl ? (
                          <img
                            src={prof.avatarUrl}
                            alt={prof.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: prof.color || themeColor }}
                          >
                            {prof.name.substring(0, 1)}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                          {prof.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                          {prof.role}
                        </span>
                      </div>
                    </div>

                    {prof.bio && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
                        {prof.bio}
                      </p>
                    )}

                    {prof.specialties && prof.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {prof.specialties.slice(0, 3).map((spec, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                    {prof.portfolioUrls && prof.portfolioUrls.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPortfolioModalProf(prof)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Ver Trabalhos
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfessional(prof);
                        setIsAnyProfessional(false);
                        setStep(2);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:scale-102 cursor-pointer text-center"
                      style={{ backgroundColor: themeColor }}
                    >
                      Selecionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 2: ESCOLHER SERVIÇO */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Trocar Profissional (
                  {isAnyProfessional ? 'Qualquer Especialista' : selectedProfessional?.name})
                </button>
                <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                  Qual serviço você deseja realizar?
                </h2>
              </div>

              {/* Filtro por Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative">
              <input
                type="text"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                placeholder="Buscar por nome do serviço..."
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-xs"
              />
            </div>

            {/* Lista de Serviços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(3);
                  }}
                  className={`p-5 rounded-3xl border transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between ${
                    selectedService?.id === service.id
                      ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-md ring-2 ring-violet-500'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        {service.category}
                      </span>
                      <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-zinc-900 dark:text-zinc-50">
                        {formatCurrency(service.price)}
                      </span>
                      <span className="block text-[11px] font-medium text-zinc-400">
                        {service.durationMinutes} min
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
                    <span>Selecionar este serviço</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PASSO 3: ESCOLHER DATA & HORÁRIO */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Trocar Serviço ({selectedService?.name})
              </button>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                Escolha o dia e o horário do seu atendimento
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Serviço:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {selectedService?.name}
                </strong>{' '}
                ({selectedService?.durationMinutes} min) com{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {isAnyProfessional ? 'Qualquer Profissional' : selectedProfessional?.name}
                </strong>
                .
              </p>
            </div>

            {/* Seletor de Datas (Próximos 14 dias em carrossel) */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-2.5">
                1. Selecione a Data
              </label>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
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
                      className={`flex flex-col items-center justify-center min-w-[70px] py-3 px-2 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-transparent text-white shadow-md scale-105'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? themeColor : undefined,
                      }}
                    >
                      <span className="text-[10px] font-extrabold uppercase">{item.weekDay}</span>
                      <span className="text-lg font-black my-0.5">{item.dayNumber}</span>
                      <span className="text-[10px] font-medium">{item.monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid de Horários Disponíveis */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                  2. Horários Livres para {formatDate(selectedDate)}
                </label>
                {isLoadingSlots && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                    Atualizando horários...
                  </span>
                )}
              </div>

              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.start)}
                      className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all text-center ${
                        selectedTimeSlot === slot.start
                          ? 'text-white shadow-md scale-105 ring-2 ring-violet-500 ring-offset-2'
                          : slot.available
                          ? 'bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-violet-500 cursor-pointer'
                          : 'bg-zinc-100 dark:bg-zinc-900/40 text-zinc-400 border border-transparent line-through cursor-not-allowed opacity-50'
                      }`}
                      style={{
                        backgroundColor:
                          selectedTimeSlot === slot.start ? themeColor : undefined,
                      }}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <Clock size={32} className="mx-auto text-zinc-400" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Nenhum horário disponível para esta data
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    O profissional pode estar de folga ou a agenda do dia já está preenchida. Tente selecionar outra data acima.
                  </p>
                </div>
              )}
            </div>

            {/* Botão de Avançar */}
            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                disabled={!selectedTimeSlot}
                onClick={() => setStep(4)}
                className="px-6 py-3 rounded-2xl text-xs font-black"
                style={{ backgroundColor: themeColor }}
              >
                Continuar para Identificação
              </Button>
            </div>
          </div>
        )}

        {/* PASSO 4: DADOS DO CLIENTE & REVISÃO */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-2 transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
                Voltar e alterar horário
              </button>
              <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                Seus dados para confirmar a reserva
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Enviaremos a confirmação detalhada para o seu WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Formulário do Cliente */}
              <form onSubmit={handleConfirmBooking} className="lg:col-span-2 space-y-4">
                <Input
                  label="Seu Nome Completo *"
                  placeholder="Ex: Maria Eduarda Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  leftIcon={<User size={16} />}
                  required
                />

                <Input
                  label="WhatsApp com DDD *"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                  leftIcon={<Phone size={16} />}
                  required
                />

                <Input
                  label="E-mail (opcional)"
                  type="email"
                  placeholder="seu@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  leftIcon={<Mail size={16} />}
                />

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Observações ou Preferências (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Tenho alergia a algum produto, gostaria de adiantar se possível..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl text-xs font-black shadow-lg text-white"
                  style={{ backgroundColor: themeColor }}
                >
                  {isSubmitting ? 'Confirmando agendamento...' : 'Confirmar Meu Agendamento'}
                </Button>
              </form>

              {/* Card de Resumo do Atendimento */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 h-fit">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Resumo da Reserva
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Serviço</span>
                    <strong className="text-sm text-zinc-900 dark:text-zinc-50 block">
                      {selectedService?.name}
                    </strong>
                    <span className="text-zinc-500">
                      {selectedService?.durationMinutes} min • {formatCurrency(selectedService?.price || 0)}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Profissional</span>
                    <strong className="text-sm text-zinc-900 dark:text-zinc-50 block">
                      {isAnyProfessional ? 'Qualquer Profissional Disponível' : selectedProfessional?.name}
                    </strong>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Data & Horário</span>
                    <strong className="text-sm text-zinc-900 dark:text-zinc-50 block">
                      {formatDate(selectedDate)} às {selectedTimeSlot}
                    </strong>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] font-bold uppercase">Local</span>
                    <strong className="text-xs text-zinc-900 dark:text-zinc-50 block">
                      {salon.name}
                    </strong>
                    <span className="text-[11px] text-zinc-400 block">
                      {salon.address || 'Endereço fornecido pelo estabelecimento'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="font-extrabold text-xs text-zinc-500">Total a Pagar</span>
                  <span className="font-black text-lg text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(selectedService?.price || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 5: SUCESSO & COMPROVANTE */}
        {step === 5 && (
          <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                Agendamento Confirmado!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Seu horário já foi reservado com sucesso no sistema do {salon.name}.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between">
                <span className="text-zinc-400">Data & Hora:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {formatDate(selectedDate)} às {selectedTimeSlot}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Serviço:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{selectedService?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Profissional:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {isAnyProfessional
                    ? confirmedBooking?.professionalName || 'Profissional Designado'
                    : selectedProfessional?.name}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Cliente:</span>
                <strong className="text-zinc-900 dark:text-zinc-100">{customerName}</strong>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {salon.whatsapp && (
                <a
                  href={`https://api.whatsapp.com/send?phone=${salon.whatsapp.replace(
                    /\D/g,
                    ''
                  )}&text=${encodeURIComponent(
                    `Olá! Acabei de agendar pelo link online para ${selectedService?.name} no dia ${formatDate(
                      selectedDate
                    )} às ${selectedTimeSlot}. Meu nome é ${customerName}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <MessageCircle size={16} />
                  Falar no WhatsApp do Salão
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTimeSlot(null);
                }}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Fazer Outro Agendamento
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. MODAL DE PORTFÓLIO / TRABALHOS DO PROFISSIONAL */}
      {portfolioModalProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setPortfolioModalProf(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-zinc-200 shrink-0">
                {portfolioModalProf.avatarUrl ? (
                  <img
                    src={portfolioModalProf.avatarUrl}
                    alt={portfolioModalProf.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-violet-600 text-white flex items-center justify-center font-bold">
                    {portfolioModalProf.name.substring(0, 1)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-50">
                  {portfolioModalProf.name}
                </h3>
                <span className="text-xs text-violet-600 font-semibold">
                  Trabalhos & Portfólio
                </span>
              </div>
            </div>

            {portfolioModalProf.bio && (
              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {portfolioModalProf.bio}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              {portfolioModalProf.portfolioUrls?.map((url, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden aspect-square border border-zinc-200 dark:border-zinc-800 shadow-sm"
                >
                  <img
                    src={url}
                    alt={`Trabalho ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                setSelectedProfessional(portfolioModalProf);
                setIsAnyProfessional(false);
                setPortfolioModalProf(null);
                setStep(2);
              }}
              className="w-full py-3 rounded-2xl text-xs font-bold text-white shadow-md mt-4"
              style={{ backgroundColor: themeColor }}
            >
              Agendar com {portfolioModalProf.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
