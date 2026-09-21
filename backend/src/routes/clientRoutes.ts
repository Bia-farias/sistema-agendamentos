import { Router } from 'express';
import { clientController } from '../controllers/clientController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createClientSchema,
  updateClientSchema,
  getClientByIdSchema,
  queryClientSchema,
} from '../schemas/clientSchema.js';

const router = Router();

// Todas as rotas de clientes exigem autenticação
router.use(authenticate);

router.get('/', validate(queryClientSchema), clientController.list);
router.get('/:id', validate(getClientByIdSchema), clientController.getById);
router.post('/', validate(createClientSchema), clientController.create);
router.put('/:id', validate(updateClientSchema), clientController.update);
router.delete('/:id', validate(getClientByIdSchema), clientController.delete);

export { router as clientRoutes };
