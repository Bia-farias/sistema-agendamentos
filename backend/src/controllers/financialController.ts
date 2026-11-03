import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { financialService } from '../services/financialService.js';
import { sendSuccess } from '../utils/response.js';

export const financialController = {
  // Receivables
  async listReceivables(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.listReceivables(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async createReceivable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.createReceivable(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async updateReceivable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.updateReceivable(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async markReceivablePaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { paymentMethod, paidAt } = req.body;
      const result = await financialService.markReceivablePaid(id, tenantId, paymentMethod, paidAt);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async deleteReceivable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.deleteReceivable(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  // Payables
  async listPayables(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.listPayables(tenantId, req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async createPayable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.createPayable(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async updatePayable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.updatePayable(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async markPayablePaid(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { paidAmount, paymentMethod, paidAt } = req.body;
      const result = await financialService.markPayablePaid(id, tenantId, paidAmount, paymentMethod, paidAt);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async deletePayable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.deletePayable(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  // Suppliers
  async listSuppliers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.listSuppliers(tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async createSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.createSupplier(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async updateSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.updateSupplier(id, tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async deleteSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.deleteSupplier(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  // Merchandise
  async listMerchandise(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.listMerchandise(tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async createMerchandise(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.createMerchandise(tenantId, req.body);
      return sendSuccess(res, result, 201);
    } catch (error) {
      return next(error);
    }
  },

  async adjustStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const { type, quantityDelta, reason } = req.body;
      const result = await financialService.adjustStock(id, tenantId, type, quantityDelta, reason);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async deleteMerchandise(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const result = await financialService.deleteMerchandise(id, tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  // Deposit Config
  async getDepositConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.getDepositConfig(tenantId);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },

  async updateDepositConfig(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId;
      const result = await financialService.updateDepositConfig(tenantId, req.body);
      return sendSuccess(res, result);
    } catch (error) {
      return next(error);
    }
  },
};

