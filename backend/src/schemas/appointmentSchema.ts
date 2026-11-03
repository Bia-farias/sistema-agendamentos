import { z } from 'zod';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createAppointmentSchema = z.object({
  body: z.object({
    clientId: z.string().uuid('ID de cliente inválido'),
    serviceId: z.string().uuid('ID de serviço inválido'),
    professionalId: z.string().uuid('ID de profissional inválido'),
    date: z.string().regex(dateRegex, 'Data deve estar no formato AAAA-MM-DD (ex: 2026-11-03)'),
    startTime: z.string().regex(timeRegex, 'Horário inicial deve estar no formato HH:mm (ex: 14:00)'),
    endTime: z.string().regex(timeRegex, 'Horário final deve estar no formato HH:mm (ex: 14:45)').optional(),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    totalPrice: z.number().min(0).optional(),
    notes: z.string().optional().nullable(),
    paymentMethod: z
      .enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'UNPAID', 'pix', 'credit_card', 'debit_card', 'cash', 'unpaid'])
      .optional()
      .transform((val) => (val ? (val.toUpperCase() as any) : 'UNPAID')),
  }),
});

export const updateAppointmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de agendamento inválido'),
  }),
  body: z.object({
    clientId: z.string().uuid('ID de cliente inválido').optional(),
    serviceId: z.string().uuid('ID de serviço inválido').optional(),
    professionalId: z.string().uuid('ID de profissional inválido').optional(),
    date: z.string().regex(dateRegex, 'Data deve estar no formato AAAA-MM-DD').optional(),
    startTime: z.string().regex(timeRegex, 'Horário inicial deve estar no formato HH:mm').optional(),
    endTime: z.string().regex(timeRegex, 'Horário final deve estar no formato HH:mm').optional(),
    durationMinutes: z.number().int().min(5).max(1440).optional(),
    totalPrice: z.number().min(0).optional(),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'pending', 'confirmed', 'completed', 'cancelled'])
      .optional()
      .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
    paymentMethod: z
      .enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'UNPAID', 'pix', 'credit_card', 'debit_card', 'cash', 'unpaid'])
      .optional()
      .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
    notes: z.string().optional().nullable(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de agendamento inválido'),
  }),
  body: z.object({
    status: z
      .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'pending', 'confirmed', 'completed', 'cancelled'])
      .transform((val) => val.toUpperCase() as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'),
  }),
});

export const getAppointmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de agendamento inválido'),
  }),
});

export const queryAppointmentSchema = z.object({
  query: z.object({
    date: z.string().regex(dateRegex).optional(),
    professionalId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    status: z
      .enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'pending', 'confirmed', 'completed', 'cancelled', 'all'])
      .optional()
      .transform((val) => (val && val !== 'all' ? (val.toUpperCase() as any) : undefined)),
    startDate: z.string().regex(dateRegex).optional(),
    endDate: z.string().regex(dateRegex).optional(),
  }),
});

export const publicBookingSchema = z.object({
  params: z.object({
    slug: z.string().min(2, 'Slug inválido'),
  }),
  body: z.object({
    customerName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    customerPhone: z.string().min(8, 'Telefone inválido'),
    customerEmail: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : null))
      .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: 'E-mail inválido',
      }),
    serviceId: z.string().uuid('ID de serviço inválido'),
    professionalId: z.string().uuid('ID de profissional inválido'),
    date: z.string().regex(dateRegex, 'Data deve estar no formato AAAA-MM-DD'),
    startTime: z.string().regex(timeRegex, 'Horário inicial deve estar no formato HH:mm'),
    notes: z.string().optional().nullable(),
  }),
});

export const publicSlotsQuerySchema = z.object({
  params: z.object({
    slug: z.string().min(2, 'Slug inválido'),
  }),
  query: z.object({
    date: z.string().regex(dateRegex, 'Data obrigatória no formato AAAA-MM-DD'),
    professionalId: z.string().uuid().optional(),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>['body'];
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>['body'];
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>['body'];
export type QueryAppointmentInput = z.infer<typeof queryAppointmentSchema>['query'];
export type PublicBookingInput = z.infer<typeof publicBookingSchema>['body'];
export type PublicSlotsQueryInput = z.infer<typeof publicSlotsQuerySchema>['query'];

