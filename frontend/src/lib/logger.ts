/**
 * Professional logging utility with environment-aware behavior and Audit Trail.
 * Akita Mode: Logging is not just 'printing', it's documentation of state changes.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private readonly AUDIT_LIMIT = 50;

  private sendToRemoteMonitor(entry: LogEntry): void {
    // Simulated remote monitor (Sentry/LogRocket/etc)
    console.debug(`[REMOTE-MONITOR] [${entry.level.toUpperCase()}] ${entry.message}`, entry.data);
  }

  private persistAuditLog(entry: LogEntry): void {
    if (!this.isDevelopment) return;

    try {
      const logsRaw = localStorage.getItem('mc_audit_trail');
      const logs: LogEntry[] = logsRaw ? JSON.parse(logsRaw) : [];
      logs.unshift(entry);
      
      // Manter apenas os últimos X logs para não estourar storage
      localStorage.setItem('mc_audit_trail', JSON.stringify(logs.slice(0, this.AUDIT_LIMIT)));
    } catch (e) {
      // Falha silenciosa no audit para não quebrar a aplicação principal
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const entry = this.formatMessage(level, message, data);

    // Persiste localmente para auditoria (Akita Mode)
    this.persistAuditLog(entry);

    // Em produção, ignoramos logs verbosos
    if (!this.isDevelopment && (level === 'info' || level === 'debug')) {
      return;
    }

    const prefix = `[${level.toUpperCase()}]`;
    const timestamp = new Date().toLocaleTimeString();

    switch (level) {
      case 'error':
        console.error(`${prefix} ${timestamp} ${message}`, data ?? '');
        if (!this.isDevelopment) {
          this.sendToRemoteMonitor(entry);
        }
        break;
      case 'warn':
        console.warn(`${prefix} ${timestamp} ${message}`, data ?? '');
        break;
      case 'info':
        console.log(`${prefix} ${timestamp} ${message}`, data ?? '');
        break;
      case 'debug':
        console.debug(`${prefix} ${timestamp} ${message}`, data ?? '');
        break;
    }
  }

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

  /**
   * Log de sincronização e estado de rede
   */
  sync(message: string, data?: unknown): void {
    this.log('debug', `[Sync] ${message}`, data);
  }

  /**
   * Log de notificações e feedback visual
   */
  toast(type: 'success' | 'error' | 'loading' | 'promise', message: string): void {
    const emoji = {
      success: '✅',
      error: '❌',
      loading: '⏳',
      promise: '🤞',
    };
    this.log('debug', `${emoji[type] ?? ''} [Toast ${type}]: ${message}`);
  }
}

export const logger = new Logger();
