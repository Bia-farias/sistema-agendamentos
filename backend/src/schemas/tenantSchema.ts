import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const updateMyPageSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome do estabelecimento deve ter pelo menos 2 caracteres').optional(),
    slug: z
      .string()
      .min(3, 'O link exclusivo deve ter pelo menos 3 caracteres')
      .max(50, 'O link exclusivo deve ter no máximo 50 caracteres')
      .regex(
        slugRegex,
        'O link deve conter apenas letras minúsculas sem acento, números e hífens (ex: espaco-belle)'
      )
      .optional(),
    logoUrl: z.string().optional().nullable(),
    coverUrl: z.string().optional().nullable(),
    galleryUrls: z.array(z.string()).optional(),
    description: z.string().max(2000, 'A descrição deve ter no máximo 2000 caracteres').optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('E-mail inválido').optional().nullable(),
    address: z.string().optional().nullable(),
    whatsapp: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    facebook: z.string().optional().nullable(),
    primaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida (deve ser hexadecimal, ex: #7c3aed)')
      .optional()
      .nullable(),
    openingTime: z.string().regex(timeRegex, 'Horário de abertura inválido (HH:mm)').optional(),
    closingTime: z.string().regex(timeRegex, 'Horário de encerramento inválido (HH:mm)').optional(),
    intervalMinutes: z.number().min(5).max(180).optional(),
    allowOnlineBooking: z.boolean().optional(),
  }),
});

export type UpdateMyPageInput = z.infer<typeof updateMyPageSchema>['body'];

export const createSaasCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
    businessType: z
      .enum(['BARBERSHOP', 'BEAUTY_SALON', 'AESTHETIC_CLINIC', 'HEALTH_CLINIC', 'OTHER'])
      .optional()
      .default('BEAUTY_SALON'),
    plan: z
      .enum(['FREE_SINGLE', 'FREE', 'STARTER', 'ADVANCE', 'PRO', 'ENTERPRISE'])
      .optional()
      .default('PRO'),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    adminName: z.string().min(2, 'Informe o nome do responsável (Admin) da empresa'),
    adminEmail: z.string().email('Informe um e-mail válido para o login do Admin'),
    adminPassword: z.string().min(6, 'A senha do Admin deve ter no mínimo 6 caracteres'),
  }),
});

export const updateSaasCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de empresa inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').optional(),
    businessType: z
      .enum(['BARBERSHOP', 'BEAUTY_SALON', 'AESTHETIC_CLINIC', 'HEALTH_CLINIC', 'OTHER'])
      .optional(),
    plan: z
      .enum(['FREE_SINGLE', 'FREE', 'STARTER', 'ADVANCE', 'PRO', 'ENTERPRISE'])
      .optional(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    adminName: z.string().min(2, 'Nome do Admin inválido').optional(),
    adminEmail: z.string().email('E-mail do Admin inválido').optional(),
    adminPassword: z
      .string()
      .optional()
      .nullable()
      .refine((val) => !val || val.trim().length >= 6, {
        message: 'A nova senha deve ter no mínimo 6 caracteres',
      }),
    isActive: z.boolean().optional(),
  }),
});

export const saasCompanyIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de empresa inválido'),
  }),
});

export type CreateSaasCompanyInput = z.infer<typeof createSaasCompanySchema>['body'];
export type UpdateSaasCompanyInput = z.infer<typeof updateSaasCompanySchema>['body'];


