import { apiClient } from './apiClient';

export interface AIChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const aiApiService = {
  async chat(messages: AIChatMessagePayload[], systemPrompt?: string): Promise<string> {
    const response = await apiClient.post<{ reply: string }>('/ai/chat', {
      messages,
      systemPrompt,
    });

    if (response?.reply) {
      return response.reply;
    }

    throw new Error('Falha ao obter resposta da IA');
  },
};
