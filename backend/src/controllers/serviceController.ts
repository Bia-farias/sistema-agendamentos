import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { serviceService } from '../services/serviceService.js';
import { sendSuccess } from '../utils/response.js';

export const serviceController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await serviceService.list(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await serviceService.getById(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await serviceService.create(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await serviceService.update(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await serviceService.delete(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },
};
