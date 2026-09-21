import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { clientService } from '../services/clientService.js';
import { sendSuccess } from '../utils/response.js';

export const clientController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await clientService.list(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await clientService.getById(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await clientService.create(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await clientService.update(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await clientService.delete(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },
};
