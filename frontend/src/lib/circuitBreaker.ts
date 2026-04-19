import { logger } from '@/lib/logger';

interface CircuitBreakerOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  fallbackMessage?: string;
}

/**
 * Circuit Breaker Error — thrown when all retries are exhausted.
 * Callers MUST handle this explicitly instead of receiving a fake 200 response.
 */
export class CircuitBreakerExhaustedError extends Error {
  constructor(message: string, public readonly attempts: number) {
    super(message);
    this.name = 'CircuitBreakerExhaustedError';
  }
}

export async function fetchWithCircuitBreaker(
  url: string,
  options: RequestInit,
  cbOptions: CircuitBreakerOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000,
  } = cbOptions;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxRetries) {
    try {
      // Inject CSRF token from cookie so backend's CSRF check (app.ts onRequest hook) passes
      const csrfCookie = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('mc_csrf_token='));
      const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie.slice('mc_csrf_token='.length)) : null;

      const headersInit = new Headers((options.headers as HeadersInit | undefined) || {});
      if (csrfToken && !headersInit.has('X-CSRF-Token')) {
        headersInit.set('X-CSRF-Token', csrfToken);
      }

      const response = await fetch(url, { ...options, headers: headersInit });
      
      // If successful or client error (4xx) not meant for retry, return it
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }
      
      // If Rate Limited or Server Error, we throw to retry
      throw new Error(`Serviço temporariamente indisponível (Status: ${response.status})`);
      
    } catch (error) {
      attempt++;
      
      if (attempt >= maxRetries) {
        // AKITA FIX: NEVER fake a 200 response. Throw a typed error so the caller
        // can decide how to handle it (show error toast, use fallback data, etc.)
        logger.error(`[CircuitBreaker] Failed after ${maxRetries} attempts:`, error);
        throw new CircuitBreakerExhaustedError(
          `Conexão falhou após ${maxRetries} tentativas. Serviço indisponível.`,
          maxRetries
        );
      }
      
      // Exponential backoff
      logger.warn(`[CircuitBreaker] Retrying API call, attempt ${attempt + 1}/${maxRetries} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }
  
  // Unreachable, but satisfies TypeScript return path
  throw new CircuitBreakerExhaustedError("Max retries exceeded unexpectedly.", maxRetries);
}
