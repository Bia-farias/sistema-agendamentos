import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    phone: z.string().min(8, 'Telefone deve ter no mínimo 8 caracteres'),
    email: z.string().email('E-mail em formato inválido').optional().nullable(),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    notes: z.string().optional().nullable(),
    isVip: z.boolean().optional().default(false),
  }),
});

export const updateClientSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de cliente inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    phone: z.string().min(8, 'Telefone deve ter no mínimo 8 caracteres').optional(),
    email: z.string().email('E-mail em formato inválido').optional().nullable(),
    birthDate: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? new Date(val) : null)),
    notes: z.string().optional().nullable(),
    isVip: z.boolean().optional(),
  }),
});

export const getClientByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de cliente inválido'),
  }),
});

export const queryClientSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isVip: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    page: z
      .string()
      .optional()
      .default('1')
      .transform((val) => Math.max(1, parseInt(val, 10) || 1)),
    limit: z
      .string()
      .optional()
      .default('20')
      .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 20))),
  }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];
export type QueryClientInput = z.infer<typeof queryClientSchema>['query'];
