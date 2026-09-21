import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { healthRoutes } from './healthRoutes.js';
import { clientRoutes } from './clientRoutes.js';
import { serviceRoutes } from './serviceRoutes.js';
import { professionalRoutes } from './professionalRoutes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/services', serviceRoutes);
router.use('/professionals', professionalRoutes);

export { router as appRoutes };

