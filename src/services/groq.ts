import { aiApiService, AIProvider } from './api/aiService';
import { useAuthStore } from '../stores/authStore';
import { useAppointmentStore } from '../stores/appointmentStore';
import { useCustomerStore } from '../stores/customerStore';
import { useServiceStore } from '../stores/serviceStore';
import { useProfessionalStore } from '../stores/professionalStore';
import { useFinancialStore } from '../stores/financialStore';
import { formatCurrency } from '../utils/format';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqChatResult {
  reply: string;
  provider: AIProvider | 'local';
  model?: string;
}

export async function sendMessageToGroq(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<GroqChatResult> {
  try {
    const res = await aiApiService.chat(messages, systemPrompt);
    return {
      reply: res.reply,
      provider: res.provider || 'groq',
      model: res.model,
    };
  } catch (err) {
    console.warn('API backend de IA indisponível, usando fallback local com dados reais:', err);
    const reply = await getLocalRealDataResponse(messages);
    return {
      reply,
      provider: 'local',
      model: 'local-context',
    };
  }
}

// ─── Local real-data fallback (never invents fake clients or fake revenue) ───

function getLocalRealDataResponse(messages: ChatMessage[]): Promise<string> {
  const rawLast = messages[messages.length - 1]?.content || '';
  const lastMessage = rawLast.toLowerCase();

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return delay(350).then(() => {
    const { tenant, profile } = useAuthStore.getState();
    const tenantName = tenant?.name || 'seu estabelecimento';
    const userRole = (profile?.role || 'receptionist').toLowerCase();
    const isManager = ['super_admin', 'owner', 'admin'].includes(userRole);

    const { appointments, getKPIs, getTodayAppointments } = useAppointmentStore.getState();
    const { customers } = useCustomerStore.getState();
    const { services } = useServiceStore.getState();
    const { professionals } = useProfessionalStore.getState();
    const { getCashFlowSummary, getFinancialKPIs } = useFinancialStore.getState();

    const kpis = getKPIs();
    const todayApts = getTodayAppointments();
    const activeServices = services.filter((s) => s.is_active);
    const activePros = professionals.filter((p) => p.is_active);

    if (/caixa|fluxo|saldo|despesa|pagar|receber|faturamento|receita|ganh|dinheiro|quanto.*hoje/i.test(lastMessage)) {
      if (!isManager) {
        return `🔒 Os indicadores financeiros e de fluxo de caixa são restritos a administradores e proprietários do **${tenantName}**.`;
      }

      const cashToday = getCashFlowSummary('today');
      const cashMonth = getCashFlowSummary('month');
      const finMonth = getFinancialKPIs('month');

      return (
        `💰 **Faturamento & Fluxo de Caixa — ${tenantName}**\n\n` +
        `• **Receita prevista na agenda hoje:** ${formatCurrency(kpis.todayRevenue)}\n` +
        `• **Caixa Hoje:** Entradas ${formatCurrency(cashToday.totalIn)} | Saídas ${formatCurrency(cashToday.totalOut)}\n` +
        `• **Caixa do Mês:** Entradas ${formatCurrency(cashMonth.totalIn)} | Saídas ${formatCurrency(cashMonth.totalOut)} | **Saldo Atual: ${formatCurrency(cashMonth.finalBalance)}**\n` +
        `• **Pendências do Mês:** A receber ${formatCurrency(finMonth.pendingReceivable + finMonth.overdueReceivable)} • Contas vencidas: **${finMonth.overdueBillsCount}**\n\n` +
        `_Consulte **Financeiro → Visão Geral & Caixa** para ver o extrato completo._`
      );
    }

    if (/agendamento|horário|agenda.*hoje|hoje.*agenda/i.test(lastMessage)) {
      if (todayApts.length === 0) {
        return appointments.length === 0
          ? `📅 **Agenda de Hoje**\n\nVocê ainda não possui agendamentos cadastrados em **${tenantName}**. ${activeServices.length === 0 || activePros.length === 0 ? 'Cadastre primeiro seus serviços e profissionais para começar a agendar!' : 'Clique em **Agenda** para marcar o primeiro horário.'}`
          : `📅 **Agenda de Hoje**\n\nNão há atendimentos agendados para hoje, mas você já possui **${appointments.length}** agendamento(s) em outras datas.`;
      }

      const list = todayApts
        .slice(0, 8)
        .map(
          (a) =>
            `• **${a.start_time}** — ${a.customer_name} → ${a.service_name} (${a.professional_name}) [${a.status}]`
        )
        .join('\n');

      return `📅 **Agenda de Hoje (${todayApts.length} horário${todayApts.length > 1 ? 's' : ''})**\n\n${list}`;
    }

    if (/vip|cliente|inativ|reativa/i.test(lastMessage)) {
      if (customers.length === 0) {
        return `👥 **Clientes**\n\nSua base ainda não tem clientes cadastrados. Acesse **Clientes → Novo Cliente** para registrar o primeiro cliente.`;
      }

      const vips = customers.filter((c) => c.is_vip);
      const inactive = customers.filter((c) => c.appointments_count <= 1);
      const vipText =
        vips.length > 0
          ? vips.slice(0, 5).map((c) => `• **${c.name}** (${c.appointments_count} visitas)`).join('\n')
          : 'Nenhum cliente marcado como VIP ainda.';
      const inactiveText =
        inactive.length > 0
          ? `\n\n💬 **Sugestão de reativação para WhatsApp:**\n_"Olá, [Nome]! Sentimos sua falta aqui no ${tenantName}! Que tal agendar um horário especial esta semana?"_`
          : '';

      return `⭐ **Resumo de Clientes (${customers.length} cadastrados)**\n\n**Clientes VIP:**\n${vipText}${inactiveText}`;
    }

    if (/serviço|catalogo|cardápio|preço|valor.*serviço/i.test(lastMessage)) {
      if (activeServices.length === 0) {
        return `✂️ **Catálogo de Serviços**\n\nNenhum serviço cadastrado ainda. Acesse **Serviços → Novo Serviço** para montar seu catálogo.`;
      }

      const tableRows = activeServices
        .slice(0, 8)
        .map((s) => `| ${s.name} | ${s.duration_minutes}min | ${formatCurrency(s.price)} |`)
        .join('\n');

      return `✂️ **Catálogo de Serviços (${activeServices.length} ativos)**\n\n| Serviço | Duração | Preço |\n|---------|---------|-------|\n${tableRows}`;
    }

    if (/profissional|equipe|funciona|especialidad/i.test(lastMessage)) {
      if (activePros.length === 0) {
        return `👥 **Equipe**\n\nNenhum profissional cadastrado ainda. Acesse **Profissionais → Novo Profissional** para adicionar sua equipe.`;
      }

      const list = activePros
        .map((p) => `• **${p.name}** — ${p.role}${isManager ? ` (comissão ${p.commission_percentage}%)` : ''}`)
        .join('\n');

      return `👥 **Equipe Ativa (${activePros.length} profissionais)**\n\n${list}`;
    }

    if (/ocup|capacidade|lotado/i.test(lastMessage)) {
      return `📊 **Taxa de Ocupação Hoje**\n\nSua ocupação estimada hoje está em **${kpis.occupancyRate}%** (${todayApts.length} atendimento${todayApts.length === 1 ? '' : 's'} registrado${todayApts.length === 1 ? '' : 's'}).`;
    }

    return (
      `✨ Olá! Sou o **Assistente IA do ${tenantName}**.\n\n` +
      `Atualmente sua conta registra:\n` +
      `• **${todayApts.length}** agendamento(s) hoje\n` +
      `• **${customers.length}** cliente(s) cadastrado(s)\n` +
      `• **${activeServices.length}** serviço(s) ativo(s)\n` +
      `• **${activePros.length}** profissional(is) na equipe\n\n` +
      `Pergunte sobre faturamento, fluxo de caixa, agenda de hoje, clientes VIP ou catálogo!`
    );
  });
}
