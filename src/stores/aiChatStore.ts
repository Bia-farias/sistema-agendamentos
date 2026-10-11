import { create } from 'zustand';
import { sendMessageToGroq, ChatMessage } from '../services/groq';
import { useAppointmentStore } from './appointmentStore';
import { useCustomerStore } from './customerStore';
import { useServiceStore } from './serviceStore';
import { useProfessionalStore } from './professionalStore';
import { useAuthStore } from './authStore';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatState {
  isOpen: boolean;
  messages: AIChatMessage[];
  isLoading: boolean;
  hasUnreadMessages: boolean;

  openChat: () => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

function buildSystemPrompt(): string {
  const tenant = useAuthStore.getState().tenant;
  const appointments = useAppointmentStore.getState().appointments;
  const customers = useCustomerStore.getState().customers;
  const services = useServiceStore.getState().services;
  const professionals = useProfessionalStore.getState().professionals;
  const kpis = useAppointmentStore.getState().getKPIs();
  const todayAppointments = useAppointmentStore.getState().getTodayAppointments();

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const vipCustomers = customers.filter((c) => c.is_vip);
  const inactiveCustomers = customers.filter((c) => c.appointments_count <= 2);
  const activeServices = services.filter((s) => s.is_active);
  const activeProfessionals = professionals.filter((p) => p.is_active);

  const todayAptsStr = todayAppointments
    .map(
      (a) =>
        `  - ${a.start_time}–${a.end_time}: ${a.customer_name} → ${a.service_name} com ${a.professional_name} [${a.status}] R$ ${a.total_price.toFixed(2)}`
    )
    .join('\n');

  const servicesStr = activeServices
    .map((s) => `  - ${s.name} (${s.category}) — R$ ${s.price.toFixed(2)} — ${s.duration_minutes}min`)
    .join('\n');

  const professionalsStr = activeProfessionals
    .map((p) => `  - ${p.name} | ${p.role} | Especialidades: ${p.specialties.join(', ')} | Comissão: ${p.commission_percentage}%`)
    .join('\n');

  const vipStr = vipCustomers
    .map((c) => `  - ${c.name} | ${c.appointments_count} visitas | R$ ${c.total_spent.toFixed(2)} investidos`)
    .join('\n');

  const inactiveStr = inactiveCustomers
    .map((c) => `  - ${c.name} | Última visita: ${c.last_visit_at || 'desconhecida'} | Telefone: ${c.phone}`)
    .join('\n');

  return `Você é o Assistente IA do sistema "${tenant?.name || 'Meu Estabelecimento'}", um software de gestão de agendamentos para salões de beleza, barbearias e clínicas estéticas.

Você tem acesso em tempo real aos dados do negócio e deve responder de forma amigável, profissional e contextualizada em português brasileiro. Use emojis com moderação para tornar as respostas mais visuais.

== CONTEXTO ATUAL ==

📅 Data e hora atual: ${dateStr} às ${timeStr}
🏪 Estabelecimento: ${tenant?.name || 'Meu Estabelecimento'} (${tenant?.business_type || 'salão de beleza'})
📞 Telefone: ${tenant?.phone || 'não cadastrado'}
📧 E-mail: ${tenant?.email || 'não cadastrado'}
🏠 Endereço: ${tenant?.address || 'não cadastrado'}

== KPIs DE HOJE ==

💰 Faturamento do dia: R$ ${kpis.todayRevenue.toFixed(2)}
📋 Total de agendamentos: ${kpis.todayAppointmentsCount}
✅ Concluídos: ${kpis.todayCompletedCount}
⏳ Pendentes: ${kpis.todayPendingCount}
📊 Taxa de ocupação: ${kpis.occupancyRate}%
📈 Variação semanal receita: +${kpis.weeklyRevenueChange}%

== AGENDAMENTOS DE HOJE ==

${todayAptsStr || '  Nenhum agendamento para hoje.'}

== CATÁLOGO DE SERVIÇOS ATIVOS ==

${servicesStr}

== EQUIPE DE PROFISSIONAIS ==

${professionalsStr}

== CLIENTES VIP ==

${vipStr || '  Nenhum cliente VIP cadastrado.'}

== CLIENTES PARA REATIVAR (poucos agendamentos) ==

${inactiveStr || '  Todos os clientes estão ativos.'}

== INSTRUÇÕES ==

1. Responda SEMPRE em português brasileiro
2. Seja direto, prático e use markdown para formatar (negrito, listas, tabelas quando útil)
3. Quando citar valores, use R$ com formatação brasileira
4. Quando não souber algo, admita e sugira uma ação prática
5. Não invente dados que não estão no contexto acima
6. Seja proativo: após responder, sugira uma próxima ação relevante quando fizer sentido
7. Use tom profissional mas descontraído e empático`;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  hasUnreadMessages: false,

  openChat: () => set({ isOpen: true, hasUnreadMessages: false }),
  closeChat: () => set({ isOpen: false }),

  clearHistory: () => set({ messages: [] }),

  sendMessage: async (content: string) => {
    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
    }));

    try {
      const systemPrompt = buildSystemPrompt();

      // Build message history for Groq (only user/assistant roles)
      const history: ChatMessage[] = get()
        .messages.filter((m) => m.role !== 'assistant' || m.id !== userMsg.id)
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendMessageToGroq(history, systemPrompt);

      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
        hasUnreadMessages: !state.isOpen,
      }));
    } catch (error) {
      const errorMsg: AIChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content:
          '⚠️ Desculpe, ocorreu um erro ao processar sua mensagem. Verifique sua conexão e tente novamente.',
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, errorMsg],
        isLoading: false,
      }));
    }
  },
}));
