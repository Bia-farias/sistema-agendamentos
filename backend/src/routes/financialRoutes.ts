import { Router } from 'express';
import { financialController } from '../controllers/financialController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createReceivableSchema,
  updateReceivableSchema,
  createPayableSchema,
  updatePayableSchema,
  createSupplierSchema,
  updateSupplierSchema,
  createMerchandiseSchema,
  updateMerchandiseSchema,
  adjustStockSchema,
  depositConfigSchema,
  financialIdParamSchema,
} from '../schemas/financialSchema.js';

const router = Router();

// Todas as rotas do módulo financeiro exigem autenticação
router.use(authenticate);

// RBAC: Apenas Proprietários e Administradores possuem acesso ao financeiro
router.use(authorize('OWNER', 'ADMIN'));

// --- RECEIVABLES (Contas a Receber) ---
router.get('/receivables', financialController.listReceivables);
router.post('/receivables', validate(createReceivableSchema), financialController.createReceivable);
router.put('/receivables/:id', validate(updateReceivableSchema), financialController.updateReceivable);
router.patch('/receivables/:id/pay', validate(financialIdParamSchema), financialController.markReceivablePaid);
router.delete('/receivables/:id', validate(financialIdParamSchema), financialController.deleteReceivable);

// --- PAYABLES (Contas a Pagar) ---
router.get('/payables', financialController.listPayables);
router.post('/payables', validate(createPayableSchema), financialController.createPayable);
router.put('/payables/:id', validate(updatePayableSchema), financialController.updatePayable);
router.patch('/payables/:id/pay', validate(financialIdParamSchema), financialController.markPayablePaid);
router.delete('/payables/:id', validate(financialIdParamSchema), financialController.deletePayable);

// --- SUPPLIERS (Fornecedores) ---
router.get('/suppliers', financialController.listSuppliers);
router.post('/suppliers', validate(createSupplierSchema), financialController.createSupplier);
router.put('/suppliers/:id', validate(updateSupplierSchema), financialController.updateSupplier);
router.delete('/suppliers/:id', validate(financialIdParamSchema), financialController.deleteSupplier);

// --- MERCHANDISE (Produtos & Estoque) ---
router.get('/merchandise', financialController.listMerchandise);
router.post('/merchandise', validate(createMerchandiseSchema), financialController.createMerchandise);
router.post('/merchandise/:id/adjust', validate(adjustStockSchema), financialController.adjustStock);
router.delete('/merchandise/:id', validate(financialIdParamSchema), financialController.deleteMerchandise);

// --- DEPOSIT CONFIG (Sinal & Pix) ---
router.get('/deposit-config', financialController.getDepositConfig);
router.put('/deposit-config', validate(depositConfigSchema), financialController.updateDepositConfig);

export { router as financialRoutes };

