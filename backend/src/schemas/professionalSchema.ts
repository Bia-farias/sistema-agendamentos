import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const createProfessionalSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome do profissional deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido').optional().nullable(),
    phone: z.string().min(8, 'Telefone inválido').optional().nullable(),
    avatarUrl: z.string().url('URL da foto inválida').optional().nullable(),
    role: z.string().min(2, 'Cargo/especialidade deve ter no mínimo 2 caracteres').default('Especialista'),
    specialties: z.array(z.string()).optional().default([]),
    commissionPercentage: z
      .number()
      .min(0, 'Comissão mínima é 0%')
      .max(100, 'Comissão máxima é 100%')
      .default(0),
    color: z.string().optional().default('#6366f1'),
    isActive: z.boolean().optional().default(true),
    workingHoursStart: z
      .string()
      .regex(timeRegex, 'Horário inicial deve estar no formato HH:mm (ex: 09:00)')
      .default('09:00'),
    workingHoursEnd: z
      .string()
      .regex(timeRegex, 'Horário final deve estar no formato HH:mm (ex: 19:00)')
      .default('19:00'),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .default([1, 2, 3, 4, 5, 6]),
  }),
});

export const updateProfessionalSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de profissional inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nome do profissional deve ter no mínimo 2 caracteres').optional(),
    email: z.string().email('E-mail inválido').optional().nullable(),
    phone: z.string().min(8, 'Telefone inválido').optional().nullable(),
    avatarUrl: z.string().url('URL da foto inválida').optional().nullable(),
    role: z.string().min(2, 'Cargo/especialidade deve ter no mínimo 2 caracteres').optional(),
    specialties: z.array(z.string()).optional(),
    commissionPercentage: z
      .number()
      .min(0, 'Comissão mínima é 0%')
      .max(100, 'Comissão máxima é 100%')
      .optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
    workingHoursStart: z
      .string()
      .regex(timeRegex, 'Horário inicial deve estar no formato HH:mm (ex: 09:00)')
      .optional(),
    workingHoursEnd: z
      .string()
      .regex(timeRegex, 'Horário final deve estar no formato HH:mm (ex: 19:00)')
      .optional(),
    workingDays: z
      .array(z.number().int().min(0).max(6))
      .optional(),
  }),
});

export const getProfessionalByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de profissional inválido'),
  }),
});

export const queryProfessionalSchema = z.object({
  query: z.object({
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    search: z.string().optional(),
    role: z.string().optional(),
  }),
});

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>['body'];
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>['body'];
export type QueryProfessionalInput = z.infer<typeof queryProfessionalSchema>['query'];
