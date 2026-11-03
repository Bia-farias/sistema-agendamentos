import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { whatsappService } from '../services/whatsappService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const whatsappController = {
  async getStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const connection = await whatsappService.getConnection(tenantId);
      return sendSuccess(res, connection);
    } catch (error: any) {
      console.error('[WhatsApp Controller] Erro ao buscar status:', error);
      return sendError(res, error.message || 'Erro ao buscar status do WhatsApp', 500);
    }
  },

  async connect(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const connection = await whatsappService.connect(tenantId, req.body);
      return sendSuccess(res, connection);
    } catch (error: any) {
      console.error('[WhatsApp Controller] Erro ao conectar:', error);
      return sendError(res, error.message || 'Erro ao conectar WhatsApp', 500);
    }
  },

  async disconnect(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const connection = await whatsappService.disconnect(tenantId);
      return sendSuccess(res, connection);
    } catch (error: any) {
      console.error('[WhatsApp Controller] Erro ao desconectar:', error);
      return sendError(res, error.message || 'Erro ao desconectar WhatsApp', 500);
    }
  },

  async getLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await whatsappService.getLogs(tenantId, limit);
      return sendSuccess(res, logs);
    } catch (error: any) {
      console.error('[WhatsApp Controller] Erro ao buscar logs:', error);
      return sendError(res, error.message || 'Erro ao buscar histórico de mensagens', 500);
    }
  },

  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const log = await whatsappService.sendMessage(tenantId, req.body);
      return sendSuccess(res, log, 201);
    } catch (error: any) {
      console.error('[WhatsApp Controller] Erro ao enviar mensagem:', error);
      return sendError(res, error.message || 'Erro ao enviar mensagem pelo WhatsApp', 500);
    }
  },
};
