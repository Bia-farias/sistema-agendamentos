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

