export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Set VITE_GROQ_API_KEY in your .env file to enable real AI responses
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export async function sendMessageToGroq(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  const isKeyConfigured = API_KEY && !API_KEY.includes('sua_chave') && API_KEY.length > 15;

  if (!isKeyConfigured) {
    return getSimulatedResponse(messages);
  }

  try {
    const allMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.warn('Groq API indisponível, alternando para resposta simulada local.');
      return getSimulatedResponse(messages);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Não foi possível gerar uma resposta.';
  } catch (err) {
    console.warn('Erro ao conectar com Groq API, usando resposta simulada:', err);
    return getSimulatedResponse(messages);
  }
}

// ─── Simulated AI responses (used when no API key is configured) ─────────────

function getSimulatedResponse(messages: ChatMessage[]): Promise<string> {
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return delay(800 + Math.random() * 700).then(() => {
    // Pattern matching for common questions
    if (/faturamento|receita|ganh|dinheiro|valor|quanto.*hoje/i.test(lastMessage)) {
      return `💰 **Faturamento de Hoje**\n\nCom base nos agendamentos de hoje, o faturamento estimado está em torno de **R$ 980,00** considerando os serviços confirmados e concluídos.\n\n📊 Serviços concluídos: R$ 140,00\n🔄 Confirmados (pendente pagamento): R$ 840,00\n\n_Dica: Acompanhe o painel de KPIs no Dashboard para dados em tempo real._`;
    }

    if (/agendamento|horário|agenda.*hoje|hoje.*agenda/i.test(lastMessage)) {
      return `📅 **Agenda de Hoje**\n\nVocê tem **6 agendamentos** programados para hoje:\n\n• **09:00** — Juliana Mendes → Corte + Escova (✅ Concluído)\n• **10:00** — Rodrigo Antunes → Corte Masculino (✔️ Confirmado)\n• **13:30** — Fernanda Oliveira → Mechas (✔️ Confirmado)\n• **14:00** — Larissa Vasconcelos → Alongamento Gel (⏳ Pendente)\n• **17:00** — Gabriel Martins → Barboterapia (⏳ Pendente)\n• **17:30** — Patricia Souza → Limpeza de Pele (✔️ Confirmado)\n\nDeseja mais detalhes sobre algum atendimento?`;
    }

    if (/vip|cliente especial|melhor cliente/i.test(lastMessage)) {
      return `⭐ **Clientes VIP**\n\nSeus 3 clientes mais valiosos são:\n\n1. **Fernanda Oliveira** — R$ 2.450,00 investidos • 12 visitas\n2. **Larissa Vasconcelos** — R$ 1.780,00 investidos • 9 visitas\n3. **Juliana Mendes** — R$ 1.250,00 investidos • 8 visitas\n\n💡 Sugestão: Envie uma mensagem de mimo para eles esta semana para reforçar o relacionamento!`;
    }

    if (/inativ|retorno|sumiu|tempo|dias/i.test(lastMessage)) {
      return `🔔 **Clientes para Reativar**\n\n**Bruno Carvalho** está inativo há mais de 70 dias. Última visita: 15/06/2026.\n\nMensagem sugerida para WhatsApp:\n\n_"Olá, Bruno! 😊 Sentimos sua falta aqui no Studio Prime! Que tal agendar uma visita essa semana? Temos novidades incríveis e adoraríamos te receber. Clique aqui para escolher seu horário: [link]"_\n\nDeseja que eu gere mais mensagens personalizadas?`;
    }

    if (/serviço|catalogo|cardápio|preço|valor.*serviço/i.test(lastMessage)) {
      return `✂️ **Catálogo de Serviços**\n\nSeus serviços mais procurados:\n\n| Serviço | Duração | Preço |\n|---------|---------|-------|\n| Mechas Criativas | 3h | R$ 480 |\n| Alongamento Gel | 2h | R$ 220 |\n| Limpeza de Pele | 1h30 | R$ 180 |\n| Massagem + Pedras | 1h | R$ 160 |\n| Corte Feminino | 1h | R$ 140 |\n\nTotal de **8 serviços ativos** no catálogo.`;
    }

    if (/profissional|equipe|funciona|especialidad/i.test(lastMessage)) {
      return `👥 **Equipe Ativa**\n\nVocê conta com **4 profissionais** ativos:\n\n• **Camila Albuquerque** — Master Stylist & Esteticista (comissão 45%)\n• **Lucas Ferreira** — Barbeiro & Visagista (comissão 50%)\n• **Beatriz Lima** — Nail Designer & Podóloga (comissão 40%)\n• **Rafael Santos** — Terapeuta Capilar & Massoterapia (comissão 40%)\n\nDeseja ver a escala de trabalho de cada um?`;
    }

    if (/whatsapp|mensagem|notifica|comunicar/i.test(lastMessage)) {
      return `📱 **Mensagem de WhatsApp**\n\nAqui está uma sugestão de mensagem de confirmação de agendamento:\n\n_"Olá, [Nome]! 🌟 Confirmando seu agendamento no Studio Prime & Estética:\n\n📅 Data: [dia]\n⏰ Horário: [hora]\n✂️ Serviço: [serviço]\n👩‍💼 Profissional: [profissional]\n\nEsperamos você! Caso precise remarcar, entre em contato com antecedência de 2 horas. Até logo! 💜"_\n\nDeseja personalizar algum detalhe?`;
    }

    if (/ocup|capacidade|lotado/i.test(lastMessage)) {
      return `📊 **Taxa de Ocupação**\n\nSua taxa de ocupação hoje está em aproximadamente **68%** da capacidade total.\n\nIsto significa que ainda há horários livres disponíveis. Considere:\n\n✅ Ativar agendamento online para os slots vagos\n📢 Postar nas redes sociais os horários disponíveis\n💬 Enviar mensagens proativas para clientes inativos\n\nDeseja que eu monte uma estratégia de captação?`;
    }

    if (/oi|olá|ola|bom dia|boa tarde|boa noite|hello|hi/i.test(lastMessage)) {
      return `✨ Olá! Sou o **Assistente IA do Studio Prime**.\n\nEstou aqui para ajudar você a gerenciar seu negócio de forma mais inteligente!\n\nPosso te ajudar com:\n• 📊 Análise do faturamento e KPIs\n• 📅 Informações sobre agendamentos\n• 👥 Gestão de clientes VIP e inativos\n• ✂️ Catálogo de serviços e preços\n• 📱 Criação de mensagens para WhatsApp\n• 💡 Sugestões estratégicas para o negócio\n\nO que você gostaria de saber?`;
    }

    if (/ajuda|help|o que você|o que pode|funcionalidad/i.test(lastMessage)) {
      return `🤖 **Minhas Capacidades**\n\nSou um assistente contextualizado com os dados reais do seu negócio. Posso:\n\n📊 **Análise Financeira**\n→ Faturamento de hoje, semana ou mês\n→ Serviços mais rentáveis\n→ Taxa de ocupação\n\n👥 **Gestão de Clientes**\n→ Identificar VIPs e inativos\n→ Sugerir ações de retenção\n→ Gerar mensagens personalizadas\n\n📅 **Agenda**\n→ Resumo de atendimentos do dia\n→ Horários disponíveis\n→ Profissional de cada serviço\n\n💡 **Estratégia**\n→ Dicas para aumentar receita\n→ Campanhas de reativação\n\nPergunte à vontade!`;
    }

    // Default fallback
    return `💡 Entendi sua pergunta sobre **"${messages[messages.length - 1]?.content?.substring(0, 50)}..."**\n\nCom base nos dados do Studio Prime, posso analisar isso melhor. Atualmente você tem:\n\n• **6 agendamentos** hoje com receita estimada de R$ 980\n• **7 clientes** cadastrados (3 VIPs)\n• **8 serviços** ativos no catálogo\n• **4 profissionais** na equipe\n\nPode reformular sua pergunta com mais detalhes? Posso ajudar com faturamento, agenda, clientes, serviços ou estratégias de crescimento! 🚀`;
  });
}
