import { logger } from "@/lib/logger";

export type ErrorCategory = 'AUTH' | 'NETWORK' | 'VALIDATION' | 'SERVER' | 'UNKNOWN';

export interface AppError {
  message: string;
  category: ErrorCategory;
  code?: string;
  details?: unknown;
  originalError?: unknown;
}

interface FirebaseError {
  code: string;
}

interface ZodError {
  name: 'ZodError';
  errors: unknown;
}

interface ApiRequestError {
  name: 'ApiRequestError';
  message: string;
  status: number;
  code?: string;
  details?: string;
}

export class ErrorService {
  /**
   * Type guard para erros do Firebase
   */
  private static isFirebaseError(error: unknown): error is FirebaseError {
    return (
      typeof error === 'object' && 
      error !== null && 
      'code' in error && 
      typeof (error as Record<string, unknown>).code === 'string'
    );
  }

  /**
   * Type guard para erros do Zod
   */
  private static isZodError(error: unknown): error is ZodError {
    return (
      typeof error === 'object' && 
      error !== null && 
      (error as Record<string, unknown>).name === 'ZodError'
    );
  }

  /**
   * Type guard para erros da API customizada
   */
  private static isApiRequestError(error: unknown): error is ApiRequestError {
    return (
      typeof error === 'object' && 
      error !== null && 
      (error as Record<string, unknown>).name === 'ApiRequestError'
    );
  }

  /**
   * Normaliza qualquer erro para o formato AppError consumível pela UI.
   */
  static normalize(error: unknown): AppError {
    // 1. Erros do Firebase Auth
    if (this.isFirebaseError(error) && error.code.startsWith('auth/')) {
      return this.handleFirebaseError(error);
    }

    // 2. Erros de Validação (Zod)
    if (this.isZodError(error)) {
      return {
        message: 'Os dados recebidos são inválidos.',
        category: 'VALIDATION',
        details: error.errors,
        originalError: error
      };
    }

    // 3. Erros de Rede/API (baseados no api.ts)
    if (this.isApiRequestError(error)) {
      return {
        message: error.message,
        category: error.status >= 500 ? 'SERVER' : 'NETWORK',
        code: error.code,
        details: error.details,
        originalError: error
      };
    }

    // 4. Erros Genéricos
    const message = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
    
    return {
      message,
      category: 'UNKNOWN',
      originalError: error
    };
  }

  /**
   * Loga o erro de forma estruturada para monitoramento.
   */
  static log(error: unknown, context?: string): void {
    const normalized = this.normalize(error);
    const logMessage = context ? `[${context}] ${normalized.message}` : normalized.message;

    if (normalized.category === 'SERVER' || normalized.category === 'UNKNOWN') {
      logger.error(logMessage, normalized);
    } else {
      logger.warn(logMessage, normalized);
    }
  }

  private static handleFirebaseError(error: FirebaseError): AppError {
    let message = 'Erro na autenticação.';
    
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'E-mail ou senha incorretos.';
        break;
      case 'auth/email-already-in-use':
        message = 'Este e-mail já está em uso.';
        break;
      case 'auth/weak-password':
        message = 'A senha é muito fraca.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Login cancelado.';
        break;
      case 'auth/network-request-failed':
        message = 'Falha de conexão com o Firebase.';
        break;
    }

    return {
      message,
      category: 'AUTH',
      code: error.code,
      originalError: error
    };
  }
}
