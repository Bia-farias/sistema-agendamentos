import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  getAppointmentByIdSchema,
  queryAppointmentSchema,
} from '../schemas/appointmentSchema.js';

const router = Router();

// Todas as rotas de agendamentos exigem autenticação
router.use(authenticate);

// Leitura: membros da equipe podem consultar agendamentos
router.get('/', validate(queryAppointmentSchema), appointmentController.list);
router.get('/:id', validate(getAppointmentByIdSchema), appointmentController.getById);

// Criação e Atualização: recepcionistas, administradores e donos
router.post(
  '/',
  authorize('OWNER', 'ADMIN', 'RECEPTIONIST'),
  validate(createAppointmentSchema),
  appointmentController.create
);

router.put(
  '/:id',
  authorize('OWNER', 'ADMIN', 'RECEPTIONIST'),
  validate(updateAppointmentSchema),
  appointmentController.update
);

// Atualização de Status: profissionais também podem atualizar status de seus atendimentos (ex: Concluído)
router.patch(
  '/:id/status',
  authorize('OWNER', 'ADMIN', 'RECEPTIONIST', 'PROFESSIONAL'),
  validate(updateAppointmentStatusSchema),
  appointmentController.updateStatus
);

// Exclusão / Cancelamento definitivo: administradores e donos
router.delete(
  '/:id',
  authorize('OWNER', 'ADMIN'),
  validate(getAppointmentByIdSchema),
  appointmentController.delete
);

export { router as appointmentRoutes };

