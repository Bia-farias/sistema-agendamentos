import { apiClient } from './apiClient';

export interface AIChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type AIProvider = 'groq' | 'fallback';

export interface AIStatusResponse {
  connected: boolean;
  provider: AIProvider;
  model: string;
}

export interface AIChatResponse {
  reply: string;
  provider?: AIProvider;
  model?: string;
}

export const aiApiService = {
  async getStatus(): Promise<AIStatusResponse> {
    return apiClient.get<AIStatusResponse>('/ai/status');
  },

  async chat(
    messages: AIChatMessagePayload[],
    systemPrompt?: string
  ): Promise<AIChatResponse> {
    const response = await apiClient.post<AIChatResponse>('/ai/chat', {
      messages,
      systemPrompt,
    });

    if (response?.reply) {
      return response;
    }

    throw new Error('Falha ao obter resposta da IA');
  },
};
