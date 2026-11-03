import { env } from '../config/env.js';
import { AIChatInput } from '../schemas/aiSchema.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

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
 * Gera resposta simulada inteligente caso a chave da Groq não esteja presente
 * ou a API externa esteja temporariamente inacessível.
 */
function generateContextualFallback(lastMessage: string): string {
  const query = lastMessage.toLowerCase();

  if (/faturamento|receita|ganh|dinheiro|valor|quanto.*hoje/i.test(query)) {
    return (
      '💰 **Faturamento & Métricas do Dia**\n\n' +
      'Com base nos agendamentos registrados hoje, a receita estimada está calculada com base nos serviços confirmados.\n\n' +
      '• **Dica de Gestão:** Acompanhe o fluxo de recebimentos no módulo **Financeiro** para conciliar entradas via Pix e Cartão.'
    );
  }

  if (/agenda|horário|hoje|agendamento/i.test(query)) {
    return (
      '📅 **Resumo da Agenda**\n\n' +
      'Os agendamentos do dia estão sincronizados em tempo real no banco de dados com proteção anti-colisão.\n\n' +
      'Consulte a tela **Agenda** para detalhes de horários por profissional.'
    );
  }

  if (/vip|cliente especial|melhor cliente/i.test(query)) {
    return (
      '⭐ **Clientes em Destaque (VIP)**\n\n' +
      'O sistema identifica automaticamente os clientes com maior frequência e volume de visitas.\n\n' +
      '💡 **Sugestão:** Envie uma mensagem pelo WhatsApp para fidelizar seus principais clientes.'
    );
  }

  if (/serviço|preço|catálogo|valor/i.test(query)) {
    return (
      '✂️ **Catálogo de Serviços**\n\n' +
      'Todos os serviços cadastrados estão integrados à sua página de agendamento online pública.\n\n' +
      'Você pode ajustar preços e duração no menu **Serviços**.'
    );
  }

  return (
    '✨ Olá! Sou o **Assistente IA do Agenda AI**.\n\n' +
    'Estou aqui para apoiar a gestão do seu estabelecimento com análises e orientações práticas.\n\n' +
    'Você pode me perguntar sobre faturamento, agenda, clientes ou estratégias para aumentar seus atendimentos!'
  );
}

export const aiService = {
  sanitizeText: sanitizeForLGPD,

  async chat(tenantId: string, input: AIChatInput): Promise<string> {
    const rawApiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY || '';
    const isGroqConfigured =
      Boolean(rawApiKey) &&
      rawApiKey.length > 15 &&
      !rawApiKey.includes('sua_chave');

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

    // 2. Se a chave não estiver configurada, usa o gerador inteligente seguro
    if (!isGroqConfigured) {
      return generateContextualFallback(lastUserMessage);
    }

    // 3. Chamada à API Groq com dados sanitizados
    try {
      const messagesPayload = [
        { role: 'system', content: sanitizedSystemPrompt },
        ...sanitizedMessages,
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawApiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: messagesPayload,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        console.warn(`[AI Service] Groq retornou status ${response.status}. Usando fallback contextual.`);
        return generateContextualFallback(lastUserMessage);
      }

      const data = (await response.json()) as any;
      const reply = data?.choices?.[0]?.message?.content;

      if (!reply) {
        return generateContextualFallback(lastUserMessage);
      }

      return reply;
    } catch (error) {
      console.warn('[AI Service] Erro ao comunicar com Groq:', error);
      return generateContextualFallback(lastUserMessage);
    }
  },
};

