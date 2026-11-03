import { prisma } from '../database/prisma.js';
import { SendWhatsAppMessageInput, UpdateWhatsAppConnectionInput } from '../schemas/whatsappSchema.js';

export const whatsappService = {
  /**
   * Obtém as informações da conexão do WhatsApp para o tenant
   */
  async getConnection(tenantId: string) {
    let connection = await prisma.whatsAppConnection.findUnique({
      where: { tenantId },
    });

    if (!connection) {
      connection = await prisma.whatsAppConnection.create({
        data: {
          tenantId,
          status: 'disconnected',
          phoneNumber: '',
          instanceName: 'WhatsApp Business',
          batteryLevel: 100,
          totalSentThisMonth: 0,
          confirmationRate: 0,
        },
      });
    }

    return connection;
  },

  /**
   * Conecta a instância do WhatsApp do tenant
   */
  async connect(tenantId: string, input?: UpdateWhatsAppConnectionInput) {
    const phoneNumber = input?.phoneNumber || '+55 (11) 98888-7777';
    const instanceName = input?.instanceName || 'WhatsApp Business';
    const lastSyncAt = new Date().toLocaleString('pt-BR');

    return prisma.whatsAppConnection.upsert({
      where: { tenantId },
      update: {
        status: 'connected',
        phoneNumber,
        instanceName,
        batteryLevel: 98,
        lastSyncAt,
      },
      create: {
        tenantId,
        status: 'connected',
        phoneNumber,
        instanceName,
        batteryLevel: 98,
        lastSyncAt,
      },
    });
  },

  /**
   * Desconecta a instância do WhatsApp do tenant
   */
  async disconnect(tenantId: string) {
    return prisma.whatsAppConnection.upsert({
      where: { tenantId },
      update: {
        status: 'disconnected',
        phoneNumber: '',
        lastSyncAt: 'Desconectado',
      },
      create: {
        tenantId,
        status: 'disconnected',
        phoneNumber: '',
        lastSyncAt: 'Desconectado',
      },
    });
  },

  /**
   * Retorna os últimos logs de mensagens enviadas
   */
  async getLogs(tenantId: string, limit = 50) {
    return prisma.whatsAppMessageLog.findMany({
      where: { tenantId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Registra um disparo de mensagem e atualiza as métricas da conexão
   */
  async logMessage(tenantId: string, input: SendWhatsAppMessageInput) {
    const log = await prisma.whatsAppMessageLog.create({
      data: {
        tenantId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        appointmentId: input.appointmentId || null,
        templateName: input.templateName || 'Mensagem Manual',
        message: input.message,
        status: 'delivered',
      },
    });

    // Atualiza contadores de envio
    await prisma.whatsAppConnection.upsert({
      where: { tenantId },
      update: {
        totalSentThisMonth: { increment: 1 },
        lastSyncAt: new Date().toLocaleString('pt-BR'),
      },
      create: {
        tenantId,
        status: 'connected',
        phoneNumber: '+55 (11) 98888-7777',
        totalSentThisMonth: 1,
        lastSyncAt: new Date().toLocaleString('pt-BR'),
      },
    });

    return log;
  },

  /**
   * Envia uma mensagem pelo WhatsApp (simulação do gateway / API oficial)
   */
  async sendMessage(tenantId: string, input: SendWhatsAppMessageInput) {
    // Normalizar telefone (remover caracteres especiais)
    let cleanPhone = input.customerPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55') && cleanPhone.length <= 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    return this.logMessage(tenantId, {
      ...input,
      customerPhone: cleanPhone,
    });
  },
};

