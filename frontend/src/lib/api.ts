import { logger } from './logger';
import { z } from 'zod';

// Em DEV usamos path relativo ('/api') para que o proxy do Vite encaminhe
// a requisição e envie os cookies HttpOnly corretamente (same-origin).
// backend independente ou /api se estiver via proxy/mesmo domínio.
const API_URL = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT = 12000; // 12s: fail fast > 20s de tela travada
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
      if (!res.ok) {
        logger.warn('[API] Refresh session failed, clearing auth state.');
        clearAuthSession();
        return false;
      }
      const data = await res.json().catch(() => null);
      authSnapshot = { csrfToken: data?.csrfToken || authSnapshot.csrfToken, isAuthenticated: true };
      emitAuthSnapshot();
      return true;
    } catch (err) {
      logger.warn('[API] tryRefreshSession threw', err);
      clearAuthSession();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  schema?: z.ZodType<unknown>;
}

async function _doRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
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
      const start = performance.now();
      let response = await executeRequest();
      const duration = performance.now() - start;
      if (duration > 5000) {
        logger.warn(`[TELEMETRIA] API lenta detectada: ${endpoint} levou ${Math.round(duration)}ms`);
      }

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
      
      // Validation Stage (Akita Mode) Strict Fail Fast
      if (options.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          logger.error(`[API-VALIDATION-ERROR] ${endpoint}`, result.error);
          throw result.error; // Akita Mode: Fail fast para que o ErrorBoundary segure a bronca.
        }
        return result.data as T;
      }

      return data as T;
    } catch (error: unknown) {
      const status = error instanceof ApiRequestError ? error.status : 0;
      const isNetworkError = error instanceof Error && (
        error.message?.toLowerCase().includes('fetch') ||
        error.name === 'TimeoutError' ||
        error.name === 'AbortError'
      );
      const isGatewayError = [502, 503, 504].includes(status);

      if ((isNetworkError || isGatewayError) && attempt < maxRetries) {
        attempt++;
        const backoff = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponencial: 1.5s, 3s, 6s...
        logger.warn(`API Retry ${attempt}/${maxRetries} for ${endpoint} (backoff ${backoff}ms).`);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unreachable');
}

const inflightPromises = new Map<string, Promise<any>>();

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  
  // Apenas deduplica requisições GET
  if (method !== 'GET') {
    return _doRequest<T>(endpoint, options);
  }

  // Permite ignorar o cache usando timeout custom ou headers especificos, 
  // mas como padrão deduplica endpoint exatos.
  const cacheKey = endpoint;

  if (inflightPromises.has(cacheKey)) {
    return inflightPromises.get(cacheKey) as Promise<T>;
  }

  const promise = _doRequest<T>(endpoint, options);
  inflightPromises.set(cacheKey, promise);

  promise.finally(() => {
    if (inflightPromises.get(cacheKey) === promise) {
      inflightPromises.delete(cacheKey);
    }
  });

  return promise;
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
  stream: async function* (endpoint: string, body: unknown, opts: RequestOptions = {}): AsyncGenerator<string, void, unknown> {
    const headers = new Headers(opts.headers || {});
    if (!(body instanceof FormData) && !headers.has('Content-Type') && body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    if (authSnapshot.csrfToken) {
      headers.set('X-CSRF-Token', authSnapshot.csrfToken);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...opts,
      method: 'POST',
      headers,
      credentials: 'include',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData: ApiErrorPayload = {};
      try {
        errorData = await response.json();
      } catch {
        // empty
      }
      if (response.status === 401) clearAuthSession();
      throw new ApiRequestError(errorData.message || getDefaultErrorMessage(response.status), response.status, errorData.code);
    }

    if (!response.body) {
      throw new Error('Response body is missing para streaming');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value, { stream: true });
    }
  },
};
