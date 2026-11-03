import { apiClient } from './apiClient';
import {
  WhatsAppConnectionInfo,
  WhatsAppTemplate,
  WhatsAppReminderRule,
  WhatsAppMessageLog,
} from '../../types';

export const whatsappApiService = {
  async getConnection(): Promise<WhatsAppConnectionInfo | null> {
    try {
      const data = await apiClient.get<any>('/whatsapp/status');
      if (!data) return null;

      return {
        status: data.status,
        phoneNumber: data.phoneNumber || '',
        instanceName: data.instanceName || 'WhatsApp Business',
        batteryLevel: data.batteryLevel ?? 100,
        lastSyncAt: data.lastSyncAt || 'Nunca',
        totalSentThisMonth: data.totalSentThisMonth || 0,
        confirmationRate: Number(data.confirmationRate) || 0,
      };
    } catch (err) {
      console.warn('[WhatsApp API] Falha ao consultar status da conexão:', err);
      return null;
    }
  },

  async connect(phoneNumber?: string, instanceName?: string): Promise<WhatsAppConnectionInfo | null> {
    try {
      const data = await apiClient.post<any>('/whatsapp/connect', {
        phoneNumber,
        instanceName,
      });

      return {
        status: data.status,
        phoneNumber: data.phoneNumber || '',
        instanceName: data.instanceName || 'WhatsApp Business',
        batteryLevel: data.batteryLevel ?? 100,
        lastSyncAt: data.lastSyncAt || 'Agora há pouco',
        totalSentThisMonth: data.totalSentThisMonth || 0,
        confirmationRate: Number(data.confirmationRate) || 0,
      };
    } catch (err) {
      console.warn('[WhatsApp API] Falha ao conectar WhatsApp:', err);
      return null;
    }
  },

  async disconnect(): Promise<void> {
    try {
      await apiClient.post('/whatsapp/disconnect');
    } catch (err) {
      console.warn('[WhatsApp API] Falha ao desconectar WhatsApp:', err);
    }
  },

  async getLogs(limit = 50): Promise<WhatsAppMessageLog[]> {
    try {
      const data = await apiClient.get<any[]>(`/whatsapp/logs?limit=${limit}`);
      return (data || []).map((l) => ({
        id: l.id,
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        appointmentId: l.appointmentId || undefined,
        templateName: l.templateName,
        message: l.message,
        status: l.status,
        sentAt: typeof l.sentAt === 'string' ? l.sentAt : new Date(l.sentAt).toISOString(),
        failureReason: l.failureReason || undefined,
      }));
    } catch (err) {
      console.warn('[WhatsApp API] Falha ao buscar histórico de mensagens:', err);
      return [];
    }
  },

  async sendMessage(input: {
    customerName: string;
    customerPhone: string;
    message: string;
    templateName?: string;
    appointmentId?: string;
  }): Promise<WhatsAppMessageLog | null> {
    try {
      const data = await apiClient.post<any>('/whatsapp/send', input);
      return {
        id: data.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        appointmentId: data.appointmentId || undefined,
        templateName: data.templateName,
        message: data.message,
        status: data.status,
        sentAt: typeof data.sentAt === 'string' ? data.sentAt : new Date(data.sentAt).toISOString(),
        failureReason: data.failureReason || undefined,
      };
    } catch (err) {
      console.warn('[WhatsApp API] Falha ao registrar mensagem:', err);
      return null;
    }
  },
};
