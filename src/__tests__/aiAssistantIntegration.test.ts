import { describe, it, expect } from 'vitest';
import aiChatPanelRaw from '../components/ai/AIChatPanel.tsx?raw';
import aiChatStoreRaw from '../stores/aiChatStore.ts?raw';
import groqRaw from '../services/groq.ts?raw';
import backendAIServiceRaw from '../../backend/src/services/aiService.ts?raw';
import backendAIRoutesRaw from '../../backend/src/routes/aiRoutes.ts?raw';

describe('AI Assistant Integration & Security', () => {
  it('removes insecure VITE_GROQ_API_KEY prompt from AIChatPanel and tracks backend aiStatus', () => {
    expect(aiChatPanelRaw).not.toContain('VITE_GROQ_API_KEY');
    expect(aiChatPanelRaw).toContain('aiStatus');
    expect(aiChatPanelRaw).toContain('GROQ_API_KEY');
    expect(aiChatPanelRaw).toContain('Copiar');
  });

  it('includes Fluxo de Caixa context in aiChatStore gated by isManagerRole', () => {
    expect(aiChatStoreRaw).toContain('FLUXO DE CAIXA E FINANCEIRO');
    expect(aiChatStoreRaw).toContain('getCashFlowSummary');
    expect(aiChatStoreRaw).toContain('isManagerRole');
    expect(aiChatStoreRaw).toContain('fetchStatus');
  });

  it('removes hardcoded fake Studio Prime / Juliana Mendes data from src/services/groq.ts', () => {
    expect(groqRaw).not.toContain('Studio Prime');
    expect(groqRaw).not.toContain('Juliana Mendes');
    expect(groqRaw).not.toContain('R$ 980,00');
  });

  it('exposes /status route and returns provider metadata from backend aiService', () => {
    expect(backendAIRoutesRaw).toContain("router.get('/status'");
    expect(backendAIServiceRaw).toContain('getStatus()');
    expect(backendAIServiceRaw).toContain("provider: 'groq'");
    expect(backendAIServiceRaw).toContain("provider: 'fallback'");
    expect(backendAIServiceRaw).toContain('sanitizeForLGPD');
  });
});

