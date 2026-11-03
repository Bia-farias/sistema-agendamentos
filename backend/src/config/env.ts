import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET deve ter no mínimo 10 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  GROQ_API_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Configuração inválida no .env:', _env.error.format());
  throw new Error('Variáveis de ambiente inválidas');
}

export const env = _env.data;
