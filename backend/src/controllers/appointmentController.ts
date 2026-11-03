import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { appointmentService } from '../services/appointmentService.js';
import { sendSuccess } from '../utils/response.js';

export const appointmentController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await appointmentService.list(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await appointmentService.getById(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await appointmentService.create(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await appointmentService.update(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { status } = req.body;
      const result = await appointmentService.updateStatus(id, tenantId, status);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await appointmentService.delete(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },
};

