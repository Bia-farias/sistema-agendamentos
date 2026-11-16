import { create } from 'zustand';
import { sendMessageToGroq, ChatMessage } from '../services/groq';
import { aiApiService, AIProvider } from '../services/api/aiService';
import { useAppointmentStore } from './appointmentStore';
import { useCustomerStore } from './customerStore';
import { useServiceStore } from './serviceStore';
import { useProfessionalStore } from './professionalStore';
import { useFinancialStore } from './financialStore';
import { useAuthStore } from './authStore';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIStatusState {
  connected: boolean;
  provider: AIProvider | 'local';
  model: string;
  checked: boolean;
}

interface AIChatState {
  isOpen: boolean;
  messages: AIChatMessage[];
  isLoading: boolean;
  hasUnreadMessages: boolean;
  aiStatus: AIStatusState;

  openChat: () => void;
  closeChat: () => void;
  fetchStatus: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

function isManagerRole(role?: string): boolean {
  const normalized = (role || 'receptionist').toLowerCase();
  return ['super_admin', 'owner', 'admin'].includes(normalized);
}

async function ensureBusinessContextLoaded(isManager: boolean): Promise<void> {
  const aptState = useAppointmentStore.getState();
  const custState = useCustomerStore.getState();
  const srvState = useServiceStore.getState();
  const proState = useProfessionalStore.getState();
  const finState = useFinancialStore.getState();

  const tasks: Promise<unknown>[] = [];
  if (aptState.appointments.length === 0) tasks.push(aptState.fetchAppointments());
  if (custState.customers.length === 0) tasks.push(custState.fetchCustomers());
  if (srvState.services.length === 0) tasks.push(srvState.fetchServices());
  if (proState.professionals.length === 0) tasks.push(proState.fetchProfessionals());
  if (
    isManager &&
    finState.receivables.length === 0 &&
    finState.payables.length === 0
  ) {
    tasks.push(finState.fetchFinancialData());
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

export function buildAISystemPrompt(): string {
  const tenant = useAuthStore.getState().tenant;
  const profile = useAuthStore.getState().profile;
  const isManager = isManagerRole(profile?.role);

  const appointments = useAppointmentStore.getState().appointments;
  const customers = useCustomerStore.getState().customers;
  const services = useServiceStore.getState().services;
  const professionals = useProfessionalStore.getState().professionals;
  const kpis = useAppointmentStore.getState().getKPIs();
  const todayAppointments = useAppointmentStore.getState().getTodayAppointments();

  const financialState = useFinancialStore.getState();
  const cashToday = isManager ? financialState.getCashFlowSummary('today') : null;
  const cashMonth = isManager ? financialState.getCashFlowSummary('month') : null;
  const finMonthKPIs = isManager ? financialState.getFinancialKPIs('month') : null;

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
        `  - ${a.start_time}–${a.end_time}: ${a.customer_name} → ${a.service_name} com ${a.professional_name} [${a.status}]${isManager ? ` R$ ${a.total_price.toFixed(2)}` : ''}`
    )
    .join('\n');

  const servicesStr = activeServices
    .map((s) => `  - ${s.name} (${s.category}) — R$ ${s.price.toFixed(2)} — ${s.duration_minutes}min`)
    .join('\n');

  const professionalsStr = activeProfessionals
    .map(
      (p) =>
        `  - ${p.name} | ${p.role} | Especialidades: ${p.specialties.join(', ')}${isManager ? ` | Comissão: ${p.commission_percentage}%` : ''}`
    )
    .join('\n');

  const vipStr = vipCustomers
    .map(
      (c) =>
        `  - ${c.name} | ${c.appointments_count} visitas${isManager ? ` | R$ ${c.total_spent.toFixed(2)} investidos` : ''}`
    )
    .join('\n');

  const inactiveStr = inactiveCustomers
    .map((c) => `  - ${c.name} | Última visita: ${c.last_visit_at || 'ainda sem visita registrada'}`)
    .join('\n');

  const financialSection =
    isManager && cashToday && cashMonth && finMonthKPIs
      ? `== FLUXO DE CAIXA E FINANCEIRO ==

- Caixa Hoje: Entradas R$ ${cashToday.totalIn.toFixed(2)} | Saídas R$ ${cashToday.totalOut.toFixed(2)} | Saldo no dia R$ ${cashToday.netChange.toFixed(2)}
- Caixa do Mês: Saldo Anterior R$ ${cashMonth.openingBalance.toFixed(2)} | Entradas R$ ${cashMonth.totalIn.toFixed(2)} | Saídas R$ ${cashMonth.totalOut.toFixed(2)} | Saldo Atual em Caixa R$ ${cashMonth.finalBalance.toFixed(2)}
- Lucro Líquido do Mês: R$ ${finMonthKPIs.netProfit.toFixed(2)}
- Contas a Receber Pendentes/Vencidas (Mês): R$ ${(finMonthKPIs.pendingReceivable + finMonthKPIs.overdueReceivable).toFixed(2)}
- Contas a Pagar Pendentes (Mês): R$ ${finMonthKPIs.pendingExpenses.toFixed(2)} (${finMonthKPIs.overdueBillsCount} vencida(s))
- Ticket Médio: R$ ${finMonthKPIs.averageTicket.toFixed(2)}`
      : `== FLUXO DE CAIXA E FINANCEIRO ==\n\n[Restrito a Administradores]`;

  return `Você é o Assistente IA do sistema "${tenant?.name || 'Meu Estabelecimento'}", um software de gestão de agendamentos para salões de beleza, barbearias e clínicas estéticas.

Você tem acesso em tempo real aos dados reais do negócio e deve responder de forma amigável, profissional e contextualizada em português brasileiro. Use emojis com moderação para tornar as respostas mais visuais.

== CONTEXTO ATUAL ==

📅 Data e hora atual: ${dateStr} às ${timeStr}
🏪 Estabelecimento: ${tenant?.name || 'Meu Estabelecimento'} (${tenant?.business_type || 'salão de beleza'})
👤 Usuário atual: ${profile?.full_name || 'Gestor'} (${profile?.role || 'receptionist'})
📊 Totais na base: ${appointments.length} agendamento(s) | ${customers.length} cliente(s) | ${activeServices.length} serviço(s) ativo(s) | ${activeProfessionals.length} profissional(is) ativo(s)

== KPIs DE HOJE ==

${isManager ? `💰 Faturamento previsto na agenda hoje: R$ ${kpis.todayRevenue.toFixed(2)}` : '💰 Faturamento do dia: [Restrito a Administradores]'}
📋 Total de agendamentos hoje: ${kpis.todayAppointmentsCount}
✅ Concluídos hoje: ${kpis.todayCompletedCount}
⏳ Pendentes hoje: ${kpis.todayPendingCount}
📊 Taxa de ocupação: ${kpis.occupancyRate}%

${financialSection}

== AGENDAMENTOS DE HOJE ==

${todayAptsStr || '  Nenhum agendamento para hoje.'}

== CATÁLOGO DE SERVIÇOS ATIVOS ==

${servicesStr || '  Nenhum serviço cadastrado ainda.'}

== EQUIPE DE PROFISSIONAIS ==

${professionalsStr || '  Nenhum profissional cadastrado ainda.'}

== CLIENTES VIP ==

${vipStr || '  Nenhum cliente VIP cadastrado.'}

== CLIENTES PARA REATIVAR (poucos agendamentos) ==

${inactiveStr || '  Nenhum cliente inativo identificado.'}

== INSTRUÇÕES ==

1. Responda SEMPRE em português brasileiro
2. Seja direto, prático e use markdown para formatar (negrito, listas, tabelas quando útil)
3. Quando citar valores, use R$ com formatação brasileira (ex: R$ 150,00)
4. Se algum dado ainda estiver zerado ou vazio (conta recém-criada), informe com clareza e oriente o próximo passo no sistema
5. Nunca invente clientes, horários ou valores que não estejam no contexto acima
6. Seja proativo: após responder, sugira uma próxima ação relevante quando fizer sentido`;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  hasUnreadMessages: false,
  aiStatus: {
    connected: false,
    provider: 'fallback',
    model: 'llama-3.3-70b-versatile',
    checked: false,
  },

  fetchStatus: async () => {
    try {
      const status = await aiApiService.getStatus();
      set({
        aiStatus: {
          connected: status.connected,
          provider: status.provider,
          model: status.model,
          checked: true,
        },
      });
    } catch {
      set((state) => ({
        aiStatus: {
          ...state.aiStatus,
          connected: false,
          provider: 'local',
          checked: true,
        },
      }));
    }
  },

  openChat: () => {
    set({ isOpen: true, hasUnreadMessages: false });
    const profile = useAuthStore.getState().profile;
    void get().fetchStatus();
    void ensureBusinessContextLoaded(isManagerRole(profile?.role));
  },

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
      const profile = useAuthStore.getState().profile;
      await ensureBusinessContextLoaded(isManagerRole(profile?.role));

      const systemPrompt = buildAISystemPrompt();

      const history: ChatMessage[] = get()
        .messages.filter((m) => m.role !== 'assistant' || m.id !== userMsg.id)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await sendMessageToGroq(history, systemPrompt);

      const assistantMsg: AIChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isLoading: false,
        hasUnreadMessages: !state.isOpen,
        aiStatus: {
          connected: result.provider === 'groq',
          provider: result.provider,
          model: result.model || state.aiStatus.model,
          checked: true,
        },
      }));
    } catch {
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
