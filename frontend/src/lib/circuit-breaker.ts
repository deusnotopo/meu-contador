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

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(failureThreshold = 5, resetTimeout = 30000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (_error) {
      this.recordFailure();
      return fallback();
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private reset() {
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

// Global Instances for different API domains
export const cryptoCircuitBreaker = new CircuitBreaker(3, 60000); // 1 min reset for public APIs
export const stockCircuitBreaker = new CircuitBreaker(5, 30000);
export const bcbCircuitBreaker = new CircuitBreaker(3, 45000);
export const pluggyCircuitBreaker = new CircuitBreaker(5, 30000);


// Legacy/Utility function
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
      
      if (response.ok || (response.status !== 429 && response.status < 500)) {
        return response;
      }
      
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= maxRetries) {
        throw new CircuitBreakerError(`Falha na conexão após ${maxRetries} tentativas: ${message}`);
      }
      
      attempt++;
      if (onRetry) onRetry(attempt, error instanceof Error ? error : new Error(message));
      
      const delay = baseDelay * Math.pow(2, attempt - 1) + (Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new CircuitBreakerError("Max retries exceeded unexpectedly.");
}