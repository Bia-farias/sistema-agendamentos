import { env } from '../config/env.js';
import { AIChatInput } from '../schemas/aiSchema.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_TIMEOUT_MS = 25000;

export type AIProvider = 'groq' | 'fallback';

export interface AIStatusResult {
  connected: boolean;
  provider: AIProvider;
  model: string;
}

export interface AIChatResult {
  reply: string;
  provider: AIProvider;
  model: string;
}

function hasConfiguredGroqKey(): string | null {
  const rawApiKey = (env.GROQ_API_KEY || process.env.GROQ_API_KEY || '').trim();
  if (
    rawApiKey.length > 15 &&
    !rawApiKey.includes('sua_chave') &&
    !rawApiKey.includes('your_key')
  ) {
    return rawApiKey;
  }
  return null;
}

/**
 * Higieniza textos para conformidade com a LGPD
 * Oculta telefones, CPFs e dados de identificação sensíveis de clientes.
 */
export function sanitizeForLGPD(text: string): string {
  if (!text) return '';

  return (
    text
      // Mascarar CPFs: 123.456.789-00 ou 12345678900
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[DOCUMENTO OCULTO LGPD]')
      // Mascarar números de telefone: (11) 98888-7777, +55 11 98888-7777, 11 988887777
      .replace(
        /(?:\+?55\s?)?(?:\(?\d{2}\)?[\s.-]?)?(?:9\d{4}|\d{4})[\s.-]?\d{4}\b/g,
        '[TELEFONE OCULTO LGPD]'
      )
  );
}

/**
 * Extrai seções nomeadas do systemPrompt para compor respostas contextuais reais
 * mesmo quando a API externa da Groq não estiver configurada.
 */
function extractSection(prompt: string, header: string): string {
  const marker = `== ${header} ==`;
  const idx = prompt.indexOf(marker);
  if (idx === -1) return '';
  const after = prompt.slice(idx + marker.length).trimStart();
  const nextSection = after.indexOf('\n== ');
  return (nextSection === -1 ? after : after.slice(0, nextSection)).trim();
}

/**
 * Gera resposta contextual baseada nos dados reais do tenant enviados no prompt
 * caso a chave GROQ_API_KEY não esteja configurada no backend ou falhe temporariamente.
 */
function generateContextualFallback(lastMessage: string, systemPrompt: string): string {
  const query = lastMessage.toLowerCase();

  if (/caixa|fluxo|saldo|despesa|pagar|receber|faturamento|receita|ganh|dinheiro|quanto.*hoje/i.test(query)) {
    const kpisSection = extractSection(systemPrompt, 'KPIs DE HOJE');
    const cashSection = extractSection(systemPrompt, 'FLUXO DE CAIXA E FINANCEIRO');
    if (kpisSection || cashSection) {
      return (
        '💰 **Resumo Financeiro & Caixa (Dados Reais)**\n\n' +
        (kpisSection ? `${kpisSection}\n\n` : '') +
        (cashSection ? `${cashSection}\n\n` : '') +
        '💡 **Dica:** Para conciliar entradas, saídas e contas vencidas em um só lugar, acesse **Financeiro → Visão Geral & Caixa**.'
      );
    }
  }

  if (/agenda|horário|hoje|agendamento/i.test(query)) {
    const agendaSection = extractSection(systemPrompt, 'AGENDAMENTOS DE HOJE');
    if (agendaSection) {
      return (
        '📅 **Agenda de Hoje (Tempo Real)**\n\n' +
        `${agendaSection}\n\n` +
        'Você pode confirmar, concluir ou criar novos horários diretamente na tela **Agenda**.'
      );
    }
  }

  if (/vip|cliente|inativ|reativa/i.test(query)) {
    const vipSection = extractSection(systemPrompt, 'CLIENTES VIP');
    const inactiveSection = extractSection(systemPrompt, 'CLIENTES PARA REATIVAR (poucos agendamentos)');
    if (vipSection || inactiveSection) {
      return (
        '⭐ **Panorama de Clientes**\n\n' +
        (vipSection ? `**Clientes VIP:**\n${vipSection}\n\n` : '') +
        (inactiveSection ? `**Oportunidades de Reativação:**\n${inactiveSection}` : '')
      );
    }
  }

  if (/serviço|preço|catálogo|valor/i.test(query)) {
    const servicesSection = extractSection(systemPrompt, 'CATÁLOGO DE SERVIÇOS ATIVOS');
    if (servicesSection) {
      return `✂️ **Catálogo de Serviços Ativos**\n\n${servicesSection}\n\nVocê pode ajustar preços e durações no menu **Serviços**.`;
    }
  }

  if (/equipe|profissional|comissão|funciona/i.test(query)) {
    const teamSection = extractSection(systemPrompt, 'EQUIPE DE PROFISSIONAIS');
    if (teamSection) {
      return `👥 **Equipe Cadastrada**\n\n${teamSection}\n\nGerencie escalas e comissões no menu **Profissionais**.`;
    }
  }

  return (
    '✨ Olá! Sou o **Assistente IA do Agenda AI**.\n\n' +
    'Estou conectado aos dados reais do seu estabelecimento. Você pode me perguntar sobre:\n' +
    '• 💰 Faturamento de hoje e **Fluxo de Caixa**\n' +
    '• 📅 Agendamentos e horários do dia\n' +
    '• ⭐ Clientes VIP e oportunidades de reativação\n' +
    '• ✂️ Serviços, preços e equipe\n\n' +
    'Como posso ajudar na gestão agora?'
  );
}

export const aiService = {
  sanitizeText: sanitizeForLGPD,

  getStatus(): AIStatusResult {
    const apiKey = hasConfiguredGroqKey();
    return {
      connected: Boolean(apiKey),
      provider: apiKey ? 'groq' : 'fallback',
      model: GROQ_MODEL,
    };
  },

  async chat(_tenantId: string, input: AIChatInput): Promise<AIChatResult> {
    const apiKey = hasConfiguredGroqKey();

    // 1. Higienização LGPD das mensagens e do system prompt
    const sanitizedSystemPrompt = input.systemPrompt
      ? sanitizeForLGPD(input.systemPrompt)
      : 'Você é o Assistente IA do sistema Agenda AI, especialista em gestão de beleza e estética.';

    const sanitizedMessages = input.messages.map((m) => ({
      role: m.role,
      content: sanitizeForLGPD(m.content),
    }));

    const lastUserMessage =
      [...sanitizedMessages].reverse().find((m) => m.role === 'user')?.content || '';

    // 2. Se a chave GROQ_API_KEY não estiver configurada no servidor, usa fallback com dados reais
    if (!apiKey) {
      return {
        reply: generateContextualFallback(lastUserMessage, sanitizedSystemPrompt),
        provider: 'fallback',
        model: GROQ_MODEL,
      };
    }

    // 3. Chamada à API Groq com dados sanitizados e timeout explícito
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

    try {
      const messagesPayload = [
        { role: 'system', content: sanitizedSystemPrompt },
        ...sanitizedMessages,
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messagesPayload,
          temperature: 0.65,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.warn(`[AI Service] Groq retornou status ${response.status}. Usando fallback contextual.`);
        return {
          reply: generateContextualFallback(lastUserMessage, sanitizedSystemPrompt),
          provider: 'fallback',
          model: GROQ_MODEL,
        };
      }

      const data = (await response.json()) as any;
      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        return {
          reply: generateContextualFallback(lastUserMessage, sanitizedSystemPrompt),
          provider: 'fallback',
          model: GROQ_MODEL,
        };
      }

      return {
        reply,
        provider: 'groq',
        model: GROQ_MODEL,
      };
    } catch (error) {
      console.warn('[AI Service] Erro ao comunicar com Groq:', error);
      return {
        reply: generateContextualFallback(lastUserMessage, sanitizedSystemPrompt),
        provider: 'fallback',
        model: GROQ_MODEL,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
