import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { aiChatSchema } from '../schemas/aiSchema.js';

const router = Router();

// Rota protegida: consulta o status da integração Groq no servidor
router.get('/status', authenticate, aiController.status);

// Rota protegida: apenas usuários autenticados do tenant podem usar o assistente de IA
router.post('/chat', authenticate, validate(aiChatSchema), aiController.chat);

export default router;
