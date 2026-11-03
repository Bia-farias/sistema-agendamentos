import { z } from 'zod';

export const sendWhatsAppMessageSchema = z.object({
  body: z.object({
    customerName: z.string().min(2, 'Nome do cliente é obrigatório'),
    customerPhone: z.string().min(8, 'Telefone do cliente é obrigatório'),
    message: z.string().min(1, 'Mensagem não pode ser vazia'),
    templateName: z.string().optional(),
    appointmentId: z.string().uuid().optional().nullable(),
  }),
});

export const updateWhatsAppConnectionSchema = z.object({
  body: z.object({
    status: z.enum(['connected', 'disconnected', 'connecting']).optional(),
    phoneNumber: z.string().optional(),
    instanceName: z.string().optional(),
    batteryLevel: z.number().min(0).max(100).optional(),
  }),
});

export type SendWhatsAppMessageInput = z.infer<typeof sendWhatsAppMessageSchema>['body'];
export type UpdateWhatsAppConnectionInput = z.infer<typeof updateWhatsAppConnectionSchema>['body'];

