import { Router } from 'express';
import { serviceController } from '../controllers/serviceController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  getServiceByIdSchema,
  queryServiceSchema,
} from '../schemas/serviceSchema.js';

const router = Router();

// Todas as rotas de serviços exigem autenticação
router.use(authenticate);

// Leitura: qualquer membro autenticado do tenant pode consultar
router.get('/', validate(queryServiceSchema), serviceController.list);
router.get('/:id', validate(getServiceByIdSchema), serviceController.getById);

// Modificação: apenas administradores e donos do estabelecimento
router.post(
  '/',
  authorize('OWNER', 'ADMIN'),
  validate(createServiceSchema),
  serviceController.create
);
router.put(
  '/:id',
  authorize('OWNER', 'ADMIN'),
  validate(updateServiceSchema),
  serviceController.update
);
router.delete(
  '/:id',
  authorize('OWNER', 'ADMIN'),
  validate(getServiceByIdSchema),
  serviceController.delete
);

export { router as serviceRoutes };
