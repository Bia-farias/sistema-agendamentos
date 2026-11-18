import { Router } from 'express';
import { tenantController } from '../controllers/tenantController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  updateMyPageSchema,
  createSaasCompanySchema,
  updateSaasCompanySchema,
  saasCompanyIdParamSchema,
} from '../schemas/tenantSchema.js';

const router = Router();

router.use(authenticate);

// Obter detalhes de personalização da página pública
router.get('/my-page', tenantController.getMyPage);

// Atualizar personalização da página pública (apenas administradores do estabelecimento)
router.put(
  '/my-page',
  authorize('SUPER_ADMIN', 'OWNER', 'ADMIN'),
  validate(updateMyPageSchema),
  tenantController.updateMyPage
);

// ============================================================================
// ROTAS DE GESTÃO SAAS (EXCLUSIVO PARA ACESSO OWNER / SUPER_ADMIN)
// ============================================================================
router.get(
  '/saas/companies',
  authorize('SUPER_ADMIN', 'OWNER'),
  tenantController.listSaasCompanies
);

router.post(
  '/saas/companies',
  authorize('SUPER_ADMIN', 'OWNER'),
  validate(createSaasCompanySchema),
  tenantController.createSaasCompany
);

router.put(
  '/saas/companies/:id',
  authorize('SUPER_ADMIN', 'OWNER'),
  validate(updateSaasCompanySchema),
  tenantController.updateSaasCompany
);

router.delete(
  '/saas/companies/:id',
  authorize('SUPER_ADMIN', 'OWNER'),
  validate(saasCompanyIdParamSchema),
  tenantController.deleteSaasCompany
);

export default router;

