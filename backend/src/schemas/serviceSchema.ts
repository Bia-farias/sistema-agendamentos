import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome do serviço deve ter no mínimo 2 caracteres'),
    description: z.string().optional().nullable(),
    category: z.string().min(1, 'Categoria é obrigatória').default('Geral'),
    price: z.number().min(0, 'Preço não pode ser negativo'),
    durationMinutes: z
      .number()
      .int('Duração deve ser um número inteiro')
      .min(5, 'Duração mínima é de 5 minutos')
      .max(1440, 'Duração máxima é de 24 horas')
      .default(30),
    color: z.string().optional().default('#6366f1'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de serviço inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nome do serviço deve ter no mínimo 2 caracteres').optional(),
    description: z.string().optional().nullable(),
    category: z.string().optional(),
    price: z.number().min(0, 'Preço não pode ser negativo').optional(),
    durationMinutes: z
      .number()
      .int('Duração deve ser um número inteiro')
      .min(5, 'Duração mínima é de 5 minutos')
      .max(1440, 'Duração máxima é de 24 horas')
      .optional(),
    color: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getServiceByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de serviço inválido'),
  }),
});

export const queryServiceSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
    search: z.string().optional(),
  }),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>['body'];
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>['body'];
export type QueryServiceInput = z.infer<typeof queryServiceSchema>['query'];
