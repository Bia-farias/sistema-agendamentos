/**
 * Cliente HTTP unificado para a API Backend (Express + Node.js)
 * Gerencia tokens JWT, serialização JSON e tratamento padronizado de erros.
 */

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  statusCode?: number;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode = 500, errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const TOKEN_KEY = 'agenda_ai_token';
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://sistema-agendamentos-production.up.railway.app/api' : '/api');

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Silently ignore if localStorage is restricted
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(
        'Tempo limite esgotado. O servidor backend não respondeu na porta 3001.',
        0
      );
    }
    throw new ApiError(
      'Não foi possível conectar ao servidor do Agenda AI (porta 3001). Certifique-se de que o terminal do backend está rodando.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Tratamento de 401 Unauthorized (sessão expirada)
  if (response.status === 401) {
    setAuthToken(null);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new ApiError(
      'A API do backend não está disponível nesta URL. Para testar localmente, acesse pelo http://localhost:5173 com o backend em execução.',
      502
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors[0]?.message : null) ||
      `Erro na requisição (Status HTTP ${response.status})`;

    throw new ApiError(errorMsg, response.status, data?.errors);
  }

  // A API Express retorna o padrão { success: true, data: ... }
  if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
    return data.data as T;
  }

  return data as T;
}

export const apiClient = {
  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, { method: 'GET', headers });
  },

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', headers });
  },
};

