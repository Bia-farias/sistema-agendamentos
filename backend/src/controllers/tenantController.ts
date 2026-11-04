import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { tenantService } from '../services/tenantService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const tenantController = {
  async getMyPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const myPage = await tenantService.getMyPage(tenantId);
      return sendSuccess(res, myPage);
    } catch (error) {
      return next(error);
    }
  },

  async updateMyPage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return sendError(res, 'Tenant não identificado no token', 400);
      }

      const updated = await tenantService.updateMyPage(tenantId, req.body);
      return sendSuccess(res, updated, 200);
    } catch (error) {
      return next(error);
    }
  },
};

