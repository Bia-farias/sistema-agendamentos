import { describe, it, expect, beforeEach } from 'vitest';
import { getAuthToken, setAuthToken } from '../services/api/apiClient';

describe('Auth Session Storage Policy', () => {
  beforeEach(() => {
    // Mock simples de sessionStorage e localStorage para o ambiente de testes
    const sessionMock: Record<string, string> = {};
    const localMock: Record<string, string> = {};

    (globalThis as any).sessionStorage = {
      getItem: (k: string) => sessionMock[k] || null,
      setItem: (k: string, v: string) => { sessionMock[k] = v; },
      removeItem: (k: string) => { delete sessionMock[k]; },
      clear: () => { Object.keys(sessionMock).forEach((k) => delete sessionMock[k]); },
    };

    (globalThis as any).localStorage = {
      getItem: (k: string) => localMock[k] || null,
      setItem: (k: string, v: string) => { localMock[k] = v; },
      removeItem: (k: string) => { delete localMock[k]; },
      clear: () => { Object.keys(localMock).forEach((k) => delete localMock[k]); },
    };
  });

  it('salva o token no sessionStorage e limpa o localStorage', () => {
    setAuthToken('jwt-tab-active-123');

    expect(sessionStorage.getItem('agenda_ai_token')).toBe('jwt-tab-active-123');
    expect(localStorage.getItem('agenda_ai_token')).toBeNull();
    expect(getAuthToken()).toBe('jwt-tab-active-123');
  });

  it('retorna null quando a aba é fechada (sessionStorage vazio)', () => {
    // Simulando fechamento da aba: sessionStorage é reiniciado vazio
    sessionStorage.clear();

    expect(getAuthToken()).toBeNull();
  });

  it('limpa resíduos legados de localStorage ao chamar getAuthToken', () => {
    localStorage.setItem('agenda_ai_token', 'old-persisted-token');
    sessionStorage.clear();

    const token = getAuthToken();

    // Deve retornar null pois a aba não tem token ativo
    expect(token).toBeNull();
    // E o resíduo antigo do localStorage deve ter sido apagado
    expect(localStorage.getItem('agenda_ai_token')).toBeNull();
  });

  it('remove o token do sessionStorage ao fazer logout', () => {
    setAuthToken('token-para-deslogar');
    expect(getAuthToken()).toBe('token-para-deslogar');

    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
    expect(sessionStorage.getItem('agenda_ai_token')).toBeNull();
  });
});
