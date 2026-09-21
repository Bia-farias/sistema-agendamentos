import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { professionalService } from '../services/professionalService.js';
import { sendSuccess } from '../utils/response.js';

export const professionalController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await professionalService.list(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await professionalService.getById(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await professionalService.create(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await professionalService.update(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await professionalService.delete(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },
};
