import { Router } from 'express';
import { professionalController } from '../controllers/professionalController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
  getProfessionalByIdSchema,
  queryProfessionalSchema,
} from '../schemas/professionalSchema.js';

const router = Router();

// Todas as rotas de profissionais exigem autenticação
router.use(authenticate);

// Leitura: qualquer membro do tenant pode consultar a equipe
router.get('/', validate(queryProfessionalSchema), professionalController.list);
router.get('/:id', validate(getProfessionalByIdSchema), professionalController.getById);

// Modificação: apenas administradores e proprietários
router.post(
  '/',
  authorize('OWNER', 'ADMIN'),
  validate(createProfessionalSchema),
  professionalController.create
);
router.put(
  '/:id',
  authorize('OWNER', 'ADMIN'),
  validate(updateProfessionalSchema),
  professionalController.update
);
router.delete(
  '/:id',
  authorize('OWNER', 'ADMIN'),
  validate(getProfessionalByIdSchema),
  professionalController.delete
);

export { router as professionalRoutes };
