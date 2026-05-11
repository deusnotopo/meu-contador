/**
 * Logger — Akita Mode
 * ───────────────────
 * Observabilidade estruturada com roteamento automático para Sentry em produção.
 *
 * Regras:
 *  - DEV:  logs visíveis no console com prefixo de nível e timestamp
 *  - PROD: apenas `error` e `warn` chegam ao console; todos os `error` vão ao Sentry
 *  - Audit trail persiste os últimos 50 eventos no localStorage (DEV + PROD)
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private readonly isDev = import.meta.env.DEV;
  private readonly AUDIT_LIMIT = 50;

  // ── Audit Trail (local) ──────────────────────────────────────
  private persistAuditLog(entry: LogEntry): void {
    try {
      const raw = localStorage.getItem('mc_audit_trail');
      const logs: LogEntry[] = raw ? (JSON.parse(raw) as LogEntry[]) : [];
      logs.unshift(entry);
      localStorage.setItem('mc_audit_trail', JSON.stringify(logs.slice(0, this.AUDIT_LIMIT)));
    } catch {
      // Falha silenciosa — não quebrar a aplicação
    }
  }

  // ── Sentry routing ───────────────────────────────────────────
  private sendToSentry(level: LogLevel, message: string, data?: unknown): void {
    if (this.isDev) return; // Sentry só em produção

    if (level === 'error') {
      const err = data instanceof Error ? data : new Error(message);
      captureException(err, {
        extra_message: message,
        data: data instanceof Error ? undefined : data,
      });
    } else if (level === 'warn') {
      captureMessage(message, 'warning');
      addBreadcrumb(message, 'warning', { data });
    } else {
      addBreadcrumb(message, level, { data });
    }
  }

  // ── Core log ─────────────────────────────────────────────────
  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.persistAuditLog(entry);
    this.sendToSentry(level, message, data);

    // Console output — erro e warn sempre; info/debug só em DEV
    if (!this.isDev && (level === 'info' || level === 'debug')) return;

    const prefix = `[${level.toUpperCase()}]`;
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });

    switch (level) {
      case 'error':
        console.error(`${prefix} ${time} ${message}`, data ?? '');
        break;
      case 'warn':
        console.warn(`${prefix} ${time} ${message}`, data ?? '');
        break;
      case 'info':
        console.log(`${prefix} ${time} ${message}`, data ?? '');
        break;
      case 'debug':
        console.debug(`${prefix} ${time} ${message}`, data ?? '');
        break;
    }
  }

  // ── Public API ───────────────────────────────────────────────

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, error?: unknown): void {
    this.log('error', message, error);
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  /** Log de sincronização offline */
  sync(message: string, data?: unknown): void {
    this.log('debug', `[Sync] ${message}`, data);
  }

  /** Log de feedback visual (toast) */
  toast(type: 'success' | 'error' | 'loading' | 'promise', message: string): void {
    const emoji: Record<typeof type, string> = {
      success: '✅',
      error: '❌',
      loading: '⏳',
      promise: '🤞',
    };
    this.log('debug', `${emoji[type]} [Toast ${type}]: ${message}`);
  }
}

export const logger = new Logger();
