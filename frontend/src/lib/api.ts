import { logger } from './logger';
import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://meu-contador-iyut.onrender.com');
const DEFAULT_TIMEOUT = 20000;
const RETRY_DELAY = 1500;

type AuthSnapshot = {
  csrfToken: string | null;
  isAuthenticated: boolean;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  details?: string;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: string;

  constructor(message: string, status: number, code?: string, details?: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getDefaultErrorMessage(status: number) {
  switch (status) {
    case 400: return 'Requisição inválida.';
    case 401: return 'Sua sessão expirou. Faça login novamente.';
    case 403: return 'Ação não permitida.';
    case 404: return 'Recurso não encontrado.';
    case 429: return 'Muitas tentativas. Aguarde.';
    default: return status >= 500 ? 'Erro interno do servidor.' : 'Falha na requisição.';
  }
}

function readCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('mc_csrf_token='));
  return match ? decodeURIComponent(match.slice(14)) : null;
}

let authSnapshot: AuthSnapshot = {
  csrfToken: readCsrfFromCookie(),
  isAuthenticated: false,
};

const authListeners = new Set<(snapshot: AuthSnapshot) => void>();

function emitAuthSnapshot() {
  authListeners.forEach(l => l(authSnapshot));
}

export function setCsrfToken(token: string | null) {
  authSnapshot = { ...authSnapshot, csrfToken: token, isAuthenticated: Boolean(token) || authSnapshot.isAuthenticated };
  emitAuthSnapshot();
}

export function clearAuthSession() {
  authSnapshot = { csrfToken: null, isAuthenticated: false };
  emitAuthSnapshot();
}

export function subscribeToAuthSession(listener: (snapshot: AuthSnapshot) => void) {
  authListeners.add(listener);
  listener(authSnapshot);
  return () => authListeners.delete(listener);
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) { clearAuthSession(); return false; }
      const data = await res.json().catch(() => null);
      authSnapshot = { csrfToken: data?.csrfToken || authSnapshot.csrfToken, isAuthenticated: true };
      emitAuthSnapshot();
      return true;
    } finally { refreshPromise = null; }
  })();
  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  schema?: z.ZodType<unknown>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  let attempt = 0;
  const maxRetries = options.retries ?? 0;

  const executeRequest = async (): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    if (authSnapshot.csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers.set('X-CSRF-Token', authSnapshot.csrfToken);
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || AbortSignal.timeout(timeout),
    });
  };

  while (attempt <= maxRetries) {
    try {
      let response = await executeRequest();

      // Handle 401 Refresh logic
      if (response.status === 401 && attempt === 0) {
        const refreshed = await tryRefreshSession();
        if (refreshed) {
          response = await executeRequest();
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ApiErrorPayload;
        if (response.status === 401) clearAuthSession();
        throw new ApiRequestError(errorData.message || getDefaultErrorMessage(response.status), response.status, errorData.code);
      }

      if (response.status === 204) return {} as T;
      
      const data = await response.json();
      
      // Validation Stage (Akita Mode)
      if (options.schema) {
        try {
          return options.schema.parse(data) as T;
        } catch (zodError) {
          logger.error(`[API-VALIDATION-ERROR] ${endpoint}`, zodError);
          throw zodError; 
        }
      }

      return data as T;
    } catch (error: unknown) {
      const isNetworkError = (error instanceof Error && (error.message?.toLowerCase().includes('fetch') || error.name === 'TimeoutError'));
      if (isNetworkError && attempt < maxRetries) {
        attempt++;
        logger.warn(`API Retry ${attempt}/${maxRetries} for ${endpoint} due to network failure.`);
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unreachable');
}

export const api = {
  get: <T>(endpoint: string, opts: RequestOptions = {}) => request<T>(endpoint, { ...opts, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown, opts: RequestOptions = {}) => request<T>(endpoint, {
    ...opts,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: <T>(endpoint: string, body: unknown, opts: RequestOptions = {}) => request<T>(endpoint, {
    ...opts,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  patch: <T>(endpoint: string, body: unknown, opts: RequestOptions = {}) => request<T>(endpoint, {
    ...opts,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: <T>(endpoint: string, opts: RequestOptions = {}) => request<T>(endpoint, { ...opts, method: 'DELETE' }),
};
