import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { aiService } from '../services/aiService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const aiController = {
  async chat(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const reply = await aiService.chat(tenantId, req.body);

      return sendSuccess(res, {
        reply,
      });
    } catch (error: any) {
      console.error('[AI Controller] Erro no processamento:', error);
      return sendError(res, error.message || 'Erro ao processar mensagem com assistente IA', 500);
    }
  },
};

