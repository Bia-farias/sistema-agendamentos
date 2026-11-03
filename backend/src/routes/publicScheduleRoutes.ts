import { Router } from 'express';
import { publicScheduleController } from '../controllers/publicScheduleController.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  publicBookingSchema,
  publicSlotsQuerySchema,
} from '../schemas/appointmentSchema.js';

const router = Router();

// Rota pública: Obter catálogo, profissionais e horários do salão por slug
router.get('/:slug', publicScheduleController.getSalon);

// Rota pública: Obter slots ocupados em uma data específica
router.get(
  '/:slug/slots',
  validate(publicSlotsQuerySchema),
  publicScheduleController.getBusySlots
);

// Rota pública: Reservar horário online
router.post(
  '/:slug/book',
  validate(publicBookingSchema),
  publicScheduleController.book
);

export { router as publicScheduleRoutes };

