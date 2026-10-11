import { create } from 'zustand';
import {
  WhatsAppTemplate,
  WhatsAppReminderRule,
  WhatsAppMessageLog,
  WhatsAppConnectionInfo,
} from '../types';

interface WhatsAppState {
  connection: WhatsAppConnectionInfo;
  isQrModalOpen: boolean;
  templates: WhatsAppTemplate[];
  rules: WhatsAppReminderRule[];
  logs: WhatsAppMessageLog[];
  isConnecting: boolean;

  // Actions
  setQrModalOpen: (open: boolean) => void;
  toggleRule: (ruleId: string) => void;
  updateTemplate: (templateId: string, content: string, name?: string) => void;
  createTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
  deleteTemplate: (templateId: string) => void;
  connectWhatsApp: () => Promise<void>;
  disconnectWhatsApp: () => void;
  sendMessage: (
    customerName: string,
    customerPhone: string,
    message: string,
    templateName?: string,
    appointmentId?: string
  ) => void;
  openWhatsAppWeb: (phone: string, message: string) => void;
  runReactivation: (customerNames: string[], templateId: string) => number;
  clearLogs: () => void;
}

const STORAGE_KEY = 'ngb_agenda_whatsapp_state';

const initialTemplates: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Confirmação Imediata',
    category: 'confirmation',
    content: `Olá, {cliente_nome}! 👋\n\nSeu agendamento no *{empresa}* foi confirmado com sucesso!\n\n📅 *Data:* {data}\n⏰ *Horário:* {horario}\n✂️ *Serviço:* {servico}\n👤 *Profissional:* {profissional}\n\nCaso precise remarcar, responda a esta mensagem. Te esperamos! ✨`,
    variables: ['{cliente_nome}', '{empresa}', '{data}', '{horario}', '{servico}', '{profissional}'],
  },
  {
    id: 'tpl-2',
    name: 'Lembrete 24h Antes',
    category: 'reminder',
    content: `Oi, {cliente_nome}! Passando para lembrar do seu horário amanhã! 🔔\n\n📅 *Data:* {data} às *{horario}*\n✂️ *Serviço:* {servico} com {profissional}\n📍 *Local:* {empresa}\n\nPor favor, responda:\n*1* para Confirmar presenca ✅\n*2* para Remarcar 🔄`,
    variables: ['{cliente_nome}', '{data}', '{horario}', '{servico}', '{profissional}', '{empresa}'],
  },
  {
    id: 'tpl-3',
    name: 'Lembrete 2h Antes',
    category: 'reminder',
    content: `Oi, {cliente_nome}! Seu horário no *{empresa}* é daqui a pouco, às *{horario}*! 🚗💨\n\nEstamos preparando tudo com carinho para o seu atendimento com {profissional}.\n\nSe tiver algum imprevisto no trânsito, nos avise por aqui!`,
    variables: ['{cliente_nome}', '{empresa}', '{horario}', '{profissional}'],
  },
  {
    id: 'tpl-4',
    name: 'Pós-Atendimento & Avaliação',
    category: 'feedback',
    content: `Olá, {cliente_nome}! Tudo bem? 💖\n\nEsperamos que você tenha amado o resultado do seu *{servico}* com {profissional} hoje no *{empresa}*!\n\nDe 1 a 5 estrelas, como você avalia sua experiência hoje?\nSua opinião é fundamental para nós! ⭐`,
    variables: ['{cliente_nome}', '{servico}', '{profissional}', '{empresa}'],
  },
  {
    id: 'tpl-5',
    name: 'Resgate de Clientes Inativos',
    category: 'recovery',
    content: `Oi {cliente_nome}, tudo bem? Sentimos sua falta aqui no *{empresa}*! 🌸\n\nQue tal tirar um momento especial para você esta semana?\n\nPreparamos um mimo: *15% DE DESCONTO* no seu próximo agendamento com o cupom *VOLTEI15*!\n\nResponda esta mensagem para escolher seu dia e horário preferido.`,
    variables: ['{cliente_nome}', '{empresa}'],
  },
];

const initialRules: WhatsAppReminderRule[] = [
  {
    id: 'rule-1',
    title: 'Confirmação de Agendamento',
    description: 'Envia mensagem com os detalhes assim que um novo agendamento é registrado no sistema.',
    trigger: 'booking_created',
    isActive: true,
    templateId: 'tpl-1',
    timingDescription: 'Imediato ao agendar',
    iconName: 'CheckCircle2',
  },
  {
    id: 'rule-2',
    title: 'Lembrete de Véspera (24h)',
    description: 'Envia lembrete 24 horas antes com solicitação de confirmação ou cancelamento.',
    trigger: 'before_24h',
    isActive: true,
    templateId: 'tpl-2',
    timingDescription: '24 horas antes',
    iconName: 'CalendarClock',
  },
  {
    id: 'rule-3',
    title: 'Lembrete Rápido (2h Antes)',
    description: 'Alerta de tolerância de chegada 2 horas antes do horário marcado.',
    trigger: 'before_2h',
    isActive: true,
    templateId: 'tpl-3',
    timingDescription: '2 horas antes',
    iconName: 'Clock',
  },
  {
    id: 'rule-4',
    title: 'Pesquisa de Satisfação',
    description: 'Solicita avaliação do atendimento após a finalização do serviço.',
    trigger: 'after_service',
    isActive: true,
    templateId: 'tpl-4',
    timingDescription: '1 hora após o serviço',
    iconName: 'Star',
  },
  {
    id: 'rule-5',
    title: 'Reativação de Inativos (30 dias)',
    description: 'Dispara cupom especial para clientes que não agendam há mais de 30 dias.',
    trigger: 'inactive_30d',
    isActive: false,
    templateId: 'tpl-5',
    timingDescription: 'Após 30 dias sem visita',
    iconName: 'Sparkles',
  },
];

const initialLogs: WhatsAppMessageLog[] = [];

const initialConnection: WhatsAppConnectionInfo = {
  status: 'disconnected',
  phoneNumber: '',
  instanceName: '',
  batteryLevel: 100,
  lastSyncAt: '',
  totalSentThisMonth: 0,
  confirmationRate: 0,
};

function loadSavedState() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse whatsapp state:', e);
  }
  return null;
}

const saved = loadSavedState();

export const useWhatsAppStore = create<WhatsAppState>((set, get) => ({
  connection: saved?.connection || initialConnection,
  isQrModalOpen: false,
  templates: saved?.templates || initialTemplates,
  rules: saved?.rules || initialRules,
  logs: saved?.logs || initialLogs,
  isConnecting: false,

  setQrModalOpen: (open) => set({ isQrModalOpen: open }),

  toggleRule: (ruleId) => {
    set((state) => {
      const newRules = state.rules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      );
      const updated = { ...state, rules: newRules };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { rules: newRules };
    });
  },

  updateTemplate: (templateId, content, name) => {
    set((state) => {
      const newTemplates = state.templates.map((t) =>
        t.id === templateId
          ? { ...t, content, ...(name ? { name } : {}) }
          : t
      );
      const updated = { ...state, templates: newTemplates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { templates: newTemplates };
    });
  },

  createTemplate: (templateData) => {
    set((state) => {
      const newTemplate: WhatsAppTemplate = {
        ...templateData,
        id: `tpl-${Date.now()}`,
      };
      const newTemplates = [...state.templates, newTemplate];
      const updated = { ...state, templates: newTemplates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { templates: newTemplates };
    });
  },

  deleteTemplate: (templateId) => {
    set((state) => {
      const newTemplates = state.templates.filter((t) => t.id !== templateId);
      const updated = { ...state, templates: newTemplates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { templates: newTemplates };
    });
  },

  connectWhatsApp: async () => {
    set({ isConnecting: true });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    set((state) => {
      const newConn: WhatsAppConnectionInfo = {
        ...state.connection,
        status: 'connected',
        phoneNumber: '+55 (11) 98888-7777',
        instanceName: 'Studio Prime - WhatsApp Business',
        lastSyncAt: 'Agora há pouco',
        batteryLevel: 98,
      };
      const updated = { ...state, connection: newConn, isConnecting: false, isQrModalOpen: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { connection: newConn, isConnecting: false, isQrModalOpen: false };
    });
  },

  disconnectWhatsApp: () => {
    set((state) => {
      const newConn: WhatsAppConnectionInfo = {
        ...state.connection,
        status: 'disconnected',
        phoneNumber: '',
        lastSyncAt: 'Desconectado',
      };
      const updated = { ...state, connection: newConn };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { connection: newConn };
    });
  },

  sendMessage: (customerName, customerPhone, message, templateName = 'Mensagem Direta', appointmentId) => {
    set((state) => {
      const newLog: WhatsAppMessageLog = {
        id: `log-${Date.now()}`,
        customerName,
        customerPhone,
        appointmentId,
        templateName,
        message,
        status: 'delivered',
        sentAt: 'Agora mesmo',
      };

      const newLogs = [newLog, ...state.logs];
      const newConn = {
        ...state.connection,
        totalSentThisMonth: state.connection.totalSentThisMonth + 1,
      };

      const updated = { ...state, logs: newLogs, connection: newConn };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { logs: newLogs, connection: newConn };
    });
  },

  openWhatsAppWeb: (phone, message) => {
    let cleanPhone = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
    const fullPhone =
      cleanPhone.startsWith('55') && cleanPhone.length >= 12
        ? cleanPhone
        : `55${cleanPhone}`;
    const encoded = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  runReactivation: (customerNames, templateId) => {
    const { templates, sendMessage } = get();
    const template = templates.find((t) => t.id === templateId) || templates[4];

    customerNames.forEach((name) => {
      const personalized = template.content
        .replace(/{cliente_nome}/g, name)
        .replace(/{empresa}/g, 'Studio Prime & Estética');

      sendMessage(name, '11988887777', personalized, template.name);
    });

    return customerNames.length;
  },

  clearLogs: () => {
    set((state) => {
      const updated = { ...state, logs: [] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { logs: [] };
    });
  },
}));
