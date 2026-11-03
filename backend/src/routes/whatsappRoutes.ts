import { Router } from 'express';
import { whatsappController } from '../controllers/whatsappController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  sendWhatsAppMessageSchema,
  updateWhatsAppConnectionSchema,
} from '../schemas/whatsappSchema.js';

const router = Router();

// Todas as rotas de WhatsApp exigem autenticação e cargo autorizado
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'OWNER', 'ADMIN', 'RECEPTIONIST'));

router.get('/status', whatsappController.getStatus);
router.post('/connect', validate(updateWhatsAppConnectionSchema), whatsappController.connect);
router.post('/disconnect', whatsappController.disconnect);
router.get('/logs', whatsappController.getLogs);
router.post('/send', validate(sendWhatsAppMessageSchema), whatsappController.sendMessage);

export default router;

