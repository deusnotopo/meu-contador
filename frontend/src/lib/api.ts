const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://meu-contador-iyut.onrender.com');

type AuthSnapshot = {
  csrfToken: string | null;
  isAuthenticated: boolean;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
};

let authSnapshot: AuthSnapshot = {
  csrfToken: null,
  isAuthenticated: false,
};

const authListeners = new Set<(snapshot: AuthSnapshot) => void>();

function emitAuthSnapshot() {
  authListeners.forEach((listener) => listener(authSnapshot));
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
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        clearAuthSession();
        return false;
      }

      const data = await response.json().catch(() => null);
      authSnapshot = {
        csrfToken: data?.csrfToken || authSnapshot.csrfToken,
        isAuthenticated: true,
      };
      emitAuthSnapshot();
      return true;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  const doFetch = () => {
    const headers = new Headers(options.headers || {});

    if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (options.body instanceof FormData) {
      headers.delete('Content-Type');
    }

    if (authSnapshot.csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      headers.set('X-CSRF-Token', authSnapshot.csrfToken);
    }

    return fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || AbortSignal.timeout(15000),
    });
  };

  let response = await doFetch();

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' })) as ApiErrorPayload;
    if (response.status === 401) clearAuthSession();
    throw new Error(error.message || 'API Request failed');
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string, opts: RequestInit = {}) => request<T>(endpoint, { ...opts, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown, opts: RequestInit = {}) => request<T>(endpoint, {
    ...opts,
    method: 'POST',
    body: body instanceof FormData ? body : (typeof body === 'string' ? body : JSON.stringify(body)),
  }),
  put: <T>(endpoint: string, body: unknown, opts: RequestInit = {}) => request<T>(endpoint, {
    ...opts,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  patch: <T>(endpoint: string, body: unknown, opts: RequestInit = {}) => request<T>(endpoint, {
    ...opts,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  delete: <T>(endpoint: string, opts: RequestInit = {}) => request<T>(endpoint, { ...opts, method: 'DELETE' }),
};
