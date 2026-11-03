import { z } from 'zod';

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    errorMap: () => ({ message: 'Papel da mensagem deve ser user, assistant ou system' }),
  }),
  content: z.string().min(1, 'Conteúdo da mensagem não pode ser vazio'),
});

export const aiChatSchema = z.object({
  body: z.object({
    messages: z
      .array(aiChatMessageSchema)
      .min(1, 'Pelo menos uma mensagem deve ser enviada'),
    systemPrompt: z.string().optional(),
  }),
});

export type AIChatInput = z.infer<typeof aiChatSchema>['body'];
