import { Router } from 'express';
import { tenantController } from '../controllers/tenantController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { updateMyPageSchema } from '../schemas/tenantSchema.js';

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

export default router;

