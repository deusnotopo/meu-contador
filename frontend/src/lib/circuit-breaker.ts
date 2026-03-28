/**
 * Circuit Breaker & Retry Mechanism for API Calls
 * Previne sobrecarga no servidor e implementa fallbacks em falhas consecutivas.
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export async function fetchWithRetry(url: string, options: RequestInit = {}, retryOptions: RetryOptions = {}): Promise<Response> {
  const { maxRetries = 2, baseDelay = 1000, timeout = 15000, onRetry } = retryOptions;
  
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(id);
      
      // Se não for um erro de servidor (5xx) ou rate limit (429), apenas devolve
      if (response.ok || (response.status !== 429 && response.status < 500)) {
        return response;
      }
      
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      if (attempt >= maxRetries) {
        throw new CircuitBreakerError(`Falha na conexão após ${maxRetries} tentativas: ${error.message}`);
      }
      
      attempt++;
      if (onRetry) onRetry(attempt, error);
      
      // Exponential backoff com jitter para evitar the thundering herd problem
      const delay = baseDelay * Math.pow(2, attempt - 1) + (Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new CircuitBreakerError("Max retries exceeded unexpectedly.");
}