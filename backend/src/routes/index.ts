import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { healthRoutes } from './healthRoutes.js';
import { clientRoutes } from './clientRoutes.js';
import { serviceRoutes } from './serviceRoutes.js';
import { professionalRoutes } from './professionalRoutes.js';
import { appointmentRoutes } from './appointmentRoutes.js';
import { publicScheduleRoutes } from './publicScheduleRoutes.js';
import { financialRoutes } from './financialRoutes.js';
import aiRoutes from './aiRoutes.js';
import whatsappRoutes from './whatsappRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/services', serviceRoutes);
router.use('/professionals', professionalRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/public/schedule', publicScheduleRoutes);
router.use('/financial', financialRoutes);
router.use('/ai', aiRoutes);
router.use('/whatsapp', whatsappRoutes);

export { router as appRoutes };

